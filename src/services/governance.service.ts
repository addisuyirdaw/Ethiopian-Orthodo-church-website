import { DualAuthorizationRequest, DualAuthorizationStatus, CouncilRole } from '@prisma/client';
import { NotFoundError, ConflictError, UnauthorizedError } from '../middleware/error-handler.middleware';
import prisma from '../lib/prisma';
import { institutionRepository } from '../repositories/institution.repository';
import { userRepository } from '../repositories/user.repository';
import { sebekaGubaeSeatRepository } from '../repositories/sebeka-gubae-seat.repository';

/**
 * Governance Service – Dual Authorization Workflow
 * 
 * Per Ethiopian Orthodox Tewahedo Church Administrative Constitution (2009 E.C. 4th Edition),
 * sensitive financial and governance actions require dual authorization from:
 *   - CHAIRPERSON (Liqe Menber) – Chair of Parish Council
 *   - DEPUTY_CHAIRPERSON (Mek Liqe Menber) – Deputy Chair
 * 
 * BOTH must approve (status → APPROVED) before the action can be executed.
 */

export class GovernanceService {
  /**
   * Create a dual-authorization request for a governance action.
   * 
   * The requesting user must have CHAIRPERSON, DEPUTY_CHAIRPERSON, or ACCOUNTANT role
   * within the institution. The request starts with status PENDING and awaits two approvals.
   * 
   * @param institutionId – Institution UUID
   * @param payloadType – Type of action (e.g., 'BANK_WITHDRAWAL', 'ASSET_DISPOSAL')
   * @param payloadJson – Stringified JSON containing action details
   * @param requestingUserId – User ID initiating the request
   * @returns DualAuthorizationRequest with status PENDING
   * @throws NotFoundError if institution or user not found
   * @throws UnauthorizedError if user not in governance role
   */
  async requestAction(
    institutionId: string,
    payloadType: string,
    payloadJson: string | Record<string, any>,
    requestingUserId: string,
  ): Promise<DualAuthorizationRequest> {
    // Verify institution exists
    const institution = await institutionRepository.findById(institutionId);
    if (!institution) {
      throw new NotFoundError(`Institution with ID ${institutionId} not found.`);
    }

    // Verify requesting user exists
    const requestingUser = await userRepository.findById(requestingUserId);
    if (!requestingUser) {
      throw new NotFoundError(`User with ID ${requestingUserId} not found.`);
    }

    // Verify user belongs to this institution
    if (requestingUser.institutionId !== institutionId) {
      throw new UnauthorizedError('User does not belong to this institution.');
    }

    // Verify requesting user has governance role (CHAIRPERSON, DEPUTY_CHAIRPERSON, ACCOUNTANT)
    const governanceRoles = [
      CouncilRole.LIQE_MENBER, // CHAIRPERSON
      CouncilRole.MEK_LIQE_MENBER, // DEPUTY_CHAIRPERSON
      CouncilRole.GENZEB_YAZHI, // ACCOUNTANT
    ];

    const userSeat = await sebekaGubaeSeatRepository.findActiveByUserAndInstitution(
      requestingUserId,
      institutionId,
    );

    if (!userSeat || !governanceRoles.includes(userSeat.role as any)) {
      throw new UnauthorizedError(
        'User must have CHAIRPERSON, DEPUTY_CHAIRPERSON, or ACCOUNTANT role to request governance actions.',
      );
    }

    // Stringify payload if it's an object
    const payloadJsonString = typeof payloadJson === 'string' ? payloadJson : JSON.stringify(payloadJson);

    // Create the dual authorization request (both approvals start as false)
    const request = await prisma.dualAuthorizationRequest.create({
      data: {
        institutionId,
        payloadType,
        payloadJson: payloadJsonString,
        status: DualAuthorizationStatus.PENDING,
        chairApproved: false,
        deputyApproved: false,
        // chairApprovedBy and deputyApprovedBy remain null until approval
      },
      include: {
        chairApprover: true,
        deputyApprover: true,
      },
    });

    return request;
  }

  /**
   * Approve or reject a dual-authorization request.
   * 
   * Only CHAIRPERSON or DEPUTY_CHAIRPERSON can approve. When a user approves:
   *   - If user is CHAIRPERSON: set chairApproved = true, chairApprovedBy = userId, chairApprovedAt = now
   *   - If user is DEPUTY_CHAIRPERSON: set deputyApproved = true, deputyApprovedBy = userId, deputyApprovedAt = now
   * 
   * After approval, if BOTH chairApproved and deputyApproved are true:
   *   - Set status to APPROVED and emit background event for execution
   * 
   * If user rejects (approve=false):
   *   - Set status to REJECTED and store rejectionReason
   * 
   * @param requestId – DualAuthorizationRequest UUID
   * @param userId – Approver user ID (must be CHAIRPERSON or DEPUTY_CHAIRPERSON)
   * @param approve – true to approve, false to reject
   * @param rejectionReason – Optional reason for rejection
   * @returns Updated DualAuthorizationRequest
   * @throws NotFoundError if request or user not found
   * @throws UnauthorizedError if user is not CHAIRPERSON/DEPUTY or already approved
   * @throws ConflictError if request status is not PENDING
   */
  async approveAction(
    requestId: string,
    userId: string,
    approve: boolean,
    rejectionReason?: string,
  ): Promise<DualAuthorizationRequest> {
    // Verify request exists
    const request = await prisma.dualAuthorizationRequest.findUnique({
      where: { id: requestId },
      include: {
        institution: true,
        chairApprover: true,
        deputyApprover: true,
      },
    });

    if (!request) {
      throw new NotFoundError(`DualAuthorizationRequest with ID ${requestId} not found.`);
    }

    // Only PENDING requests can be approved
    if (request.status !== DualAuthorizationStatus.PENDING) {
      throw new ConflictError(
        `Cannot approve request with status ${request.status}. Only PENDING requests can be approved.`,
      );
    }

    // Verify approver exists and belongs to institution
    const approver = await userRepository.findById(userId);
    if (!approver) {
      throw new NotFoundError(`User with ID ${userId} not found.`);
    }

    if (approver.institutionId !== request.institutionId) {
      throw new UnauthorizedError('Approver does not belong to the request institution.');
    }

    // Get approver's active seat
    const approverSeat = await sebekaGubaeSeatRepository.findActiveByUserAndInstitution(
      userId,
      request.institutionId,
    );

    if (!approverSeat) {
      throw new UnauthorizedError('User does not have an active governance seat in this institution.');
    }

    // Verify approver is CHAIRPERSON or DEPUTY_CHAIRPERSON
    if (
      approverSeat.role !== CouncilRole.LIQE_MENBER &&
      approverSeat.role !== CouncilRole.MEK_LIQE_MENBER
    ) {
      throw new UnauthorizedError(
        'Only CHAIRPERSON or DEPUTY_CHAIRPERSON can approve dual-authorization requests.',
      );
    }

    // Use Prisma transaction for atomicity
    const updatedRequest = await prisma.$transaction(async (tx) => {
      // Determine if user is chairperson or deputy
      const isChairperson = approverSeat.role === CouncilRole.LIQE_MENBER;

      if (!approve) {
        // Rejection path: only one person needs to reject
        return tx.dualAuthorizationRequest.update({
          where: { id: requestId },
          data: {
            status: DualAuthorizationStatus.REJECTED,
            rejectedReason: rejectionReason || 'No reason provided.',
          },
          include: {
            chairApprover: true,
            deputyApprover: true,
          },
        });
      }

      // Approval path
      const updateData: any = {};
      if (isChairperson) {
        // Check if chair has already approved
        if (request.chairApproved) {
          throw new ConflictError('Chairperson has already approved this request.');
        }
        updateData.chairApproved = true;
        updateData.chairApprovedBy = userId;
        updateData.chairApprovedAt = new Date();
      } else {
        // Check if deputy has already approved
        if (request.deputyApproved) {
          throw new ConflictError('Deputy Chairperson has already approved this request.');
        }
        updateData.deputyApproved = true;
        updateData.deputyApprovedBy = userId;
        updateData.deputyApprovedAt = new Date();
      }

      // After this approval, check if BOTH are now approved
      const willBothApprove =
        (isChairperson ? true : request.chairApproved) &&
        (!isChairperson ? true : request.deputyApproved);

      if (willBothApprove) {
        updateData.status = DualAuthorizationStatus.APPROVED;
        // TODO: Emit background event to execute the action
        // Example: await eventBus.emit('dualAuthApproved', { requestId, payloadType, payloadJson })
      }

      return tx.dualAuthorizationRequest.update({
        where: { id: requestId },
        data: updateData,
        include: {
          chairApprover: true,
          deputyApprover: true,
        },
      });
    });

    return updatedRequest;
  }

  /**
   * Retrieve a dual-authorization request by ID.
   * 
   * @param requestId – DualAuthorizationRequest UUID
   * @returns The request record with related user info sanitized
   * @throws NotFoundError if request not found
   */
  async getRequest(requestId: string): Promise<DualAuthorizationRequest> {
    const request = await prisma.dualAuthorizationRequest.findUnique({
      where: { id: requestId },
      include: {
        chairApprover: {
          select: {
            id: true,
            email: true,
            fullName: true,
            ecclesiasticalRole: true,
          },
        },
        deputyApprover: {
          select: {
            id: true,
            email: true,
            fullName: true,
            ecclesiasticalRole: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundError(`DualAuthorizationRequest with ID ${requestId} not found.`);
    }

    return request as any;
  }

  /**
   * List all dual-authorization requests for an institution.
   * 
   * @param institutionId – Institution UUID
   * @param status – Optional filter by status
   * @param limit – Pagination limit (default 50, max 100)
   * @param offset – Pagination offset (default 0)
   * @returns Array of requests
   * @throws NotFoundError if institution not found
   */
  async listRequests(
    institutionId: string,
    status?: DualAuthorizationStatus,
    limit: number = 50,
    offset: number = 0,
  ): Promise<DualAuthorizationRequest[]> {
    const institution = await institutionRepository.findById(institutionId);
    if (!institution) {
      throw new NotFoundError(`Institution with ID ${institutionId} not found.`);
    }

    const where: any = { institutionId };
    if (status) {
      where.status = status;
    }

    return prisma.dualAuthorizationRequest.findMany({
      where,
      take: Math.min(limit, 100),
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        chairApprover: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        deputyApprover: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }
}

// Export singleton instance
export const governanceService = new GovernanceService();
