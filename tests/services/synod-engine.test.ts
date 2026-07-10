import { OrdinationRank, CanonicalStatus, DecreeStatus, BallotChoice } from '@prisma/client';
import { synodEngineService } from '../../src/services/synod/synod-engine.service';
import prisma from '../../src/lib/prisma';

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
    clergyProfile: {
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    synodDecree: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    synodBallot: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const mockTransaction = prisma.$transaction as jest.Mock;
const mockFindFirstClergy = prisma.clergyProfile.findFirst as jest.Mock;
const mockCountClergy = prisma.clergyProfile.count as jest.Mock;
const mockFindUniqueDecree = prisma.synodDecree.findUnique as jest.Mock;
const mockUpdateDecree = prisma.synodDecree.update as jest.Mock;
const mockFindUniqueBallot = prisma.synodBallot.findUnique as jest.Mock;
const mockCreateBallot = prisma.synodBallot.create as jest.Mock;
const mockFindManyBallots = prisma.synodBallot.findMany as jest.Mock;

describe('SynodEngineService', () => {
  const bishopClerkId = 'bishop-clerk-1';
  const bishopProfile = {
    id: 'bishop-profile-1',
    userId: bishopClerkId,
    ordinationRank: OrdinationRank.BISHOP,
    canonicalStatus: CanonicalStatus.ACTIVE_GOOD_STANDING,
  };

  const activeDecree = {
    id: 'decree-1',
    title: 'Synod Decree 1',
    content: 'Canonical Decree Content',
    status: DecreeStatus.ACTIVE_VOTING,
    quorumRequired: 3,
    passingPercentage: 50,
    expiresAt: new Date(Date.now() + 3600000), // 1 hour in the future
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.mockImplementation(async (callback) => {
      return callback(prisma);
    });
  });

  it('rejects lay accounts or lower priests from voting', async () => {
    mockFindFirstClergy.mockResolvedValue({
      id: 'priest-profile-1',
      userId: 'priest-user-1',
      ordinationRank: OrdinationRank.PRIEST,
    });

    await expect(
      synodEngineService.castSynodBallot('priest-user-1', 'decree-1', BallotChoice.APPROVE),
    ).rejects.toMatchObject({
      name: 'ForbiddenError',
      message: 'Only bishops or higher ordination ranks are authorized to vote.',
    });
  });

  it('casts legitimate ballots and saves them successfully', async () => {
    mockFindFirstClergy.mockResolvedValue(bishopProfile);
    mockFindUniqueDecree.mockResolvedValue(activeDecree);
    mockFindUniqueBallot.mockResolvedValue(null);
    mockCreateBallot.mockResolvedValue({
      id: 'ballot-1',
      decreeId: activeDecree.id,
      clerkId: bishopProfile.id,
      choice: BallotChoice.APPROVE,
      castAt: new Date(),
    });
    mockFindManyBallots.mockResolvedValue([
      { choice: BallotChoice.APPROVE },
    ]);
    mockCountClergy.mockResolvedValue(10); // 10 total bishops, so not all voted yet

    const result = await synodEngineService.castSynodBallot(
      bishopClerkId,
      activeDecree.id,
      BallotChoice.APPROVE,
    );

    expect(result.ballot.choice).toBe(BallotChoice.APPROVE);
    expect(mockCreateBallot).toHaveBeenCalledTimes(1);
    expect(mockUpdateDecree).not.toHaveBeenCalled(); // No status transition
  });

  it('resolves and transitions status to PASSED when quorum is met and approval matches passing percentage', async () => {
    mockFindFirstClergy.mockResolvedValue(bishopProfile);
    mockFindUniqueDecree.mockResolvedValue(activeDecree);
    mockFindUniqueBallot.mockResolvedValue(null);
    mockCreateBallot.mockResolvedValue({
      id: 'ballot-3',
      decreeId: activeDecree.id,
      clerkId: bishopProfile.id,
      choice: BallotChoice.APPROVE,
    });
    // 3 total votes: 2 APPROVE, 1 REJECT -> 66.6% approval
    mockFindManyBallots.mockResolvedValue([
      { choice: BallotChoice.APPROVE },
      { choice: BallotChoice.APPROVE },
      { choice: BallotChoice.REJECT },
    ]);
    mockCountClergy.mockResolvedValue(3); // 3 total bishops in good standing, meaning all voted
    mockUpdateDecree.mockResolvedValue({
      ...activeDecree,
      status: DecreeStatus.PASSED,
    });

    const result = await synodEngineService.castSynodBallot(
      bishopClerkId,
      activeDecree.id,
      BallotChoice.APPROVE,
    );

    expect(result.decree.status).toBe(DecreeStatus.PASSED);
    expect(mockUpdateDecree).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: activeDecree.id },
        data: { status: DecreeStatus.PASSED },
      }),
    );
  });

  it('resolves and transitions status to REJECTED when quorum is met but approval fails threshold', async () => {
    mockFindFirstClergy.mockResolvedValue(bishopProfile);
    mockFindUniqueDecree.mockResolvedValue(activeDecree);
    mockFindUniqueBallot.mockResolvedValue(null);
    mockCreateBallot.mockResolvedValue({
      id: 'ballot-3',
      decreeId: activeDecree.id,
      clerkId: bishopProfile.id,
      choice: BallotChoice.REJECT,
    });
    // 3 total votes: 1 APPROVE, 2 REJECT -> 33.3% approval
    mockFindManyBallots.mockResolvedValue([
      { choice: BallotChoice.APPROVE },
      { choice: BallotChoice.REJECT },
      { choice: BallotChoice.REJECT },
    ]);
    mockCountClergy.mockResolvedValue(3); // 3 total bishops, all voted
    mockUpdateDecree.mockResolvedValue({
      ...activeDecree,
      status: DecreeStatus.REJECTED,
    });

    const result = await synodEngineService.castSynodBallot(
      bishopClerkId,
      activeDecree.id,
      BallotChoice.REJECT,
    );

    expect(result.decree.status).toBe(DecreeStatus.REJECTED);
    expect(mockUpdateDecree).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: activeDecree.id },
        data: { status: DecreeStatus.REJECTED },
      }),
    );
  });

  it('resolves to REJECTED if votes cast is less than quorumRequired', async () => {
    mockFindFirstClergy.mockResolvedValue(bishopProfile);
    mockFindUniqueDecree.mockResolvedValue({
      ...activeDecree,
      quorumRequired: 5, // Quorum is 5
    });
    mockFindUniqueBallot.mockResolvedValue(null);
    mockCreateBallot.mockResolvedValue({
      id: 'ballot-3',
      decreeId: activeDecree.id,
      choice: BallotChoice.APPROVE,
    });
    mockFindManyBallots.mockResolvedValue([
      { choice: BallotChoice.APPROVE },
      { choice: BallotChoice.APPROVE },
      { choice: BallotChoice.APPROVE },
    ]);
    mockCountClergy.mockResolvedValue(3); // Only 3 bishops exist, so all voted, but quorum is 5
    mockUpdateDecree.mockResolvedValue({
      ...activeDecree,
      status: DecreeStatus.REJECTED,
    });

    const result = await synodEngineService.castSynodBallot(
      bishopClerkId,
      activeDecree.id,
      BallotChoice.APPROVE,
    );

    expect(result.decree.status).toBe(DecreeStatus.REJECTED);
    expect(mockUpdateDecree).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: activeDecree.id },
        data: { status: DecreeStatus.REJECTED },
      }),
    );
  });

  it('correctly transitions and rejects an expired decree when a vote is attempted past expiresAt', async () => {
    const expiredDecree = {
      ...activeDecree,
      expiresAt: new Date(Date.now() - 3600000), // Expired 1 hour ago
    };

    mockFindFirstClergy.mockResolvedValue(bishopProfile);
    mockFindUniqueDecree.mockResolvedValue(expiredDecree);
    mockFindManyBallots.mockResolvedValue([
      { choice: BallotChoice.APPROVE },
    ]);
    mockCountClergy.mockResolvedValue(10);
    mockUpdateDecree.mockResolvedValue({
      ...expiredDecree,
      status: DecreeStatus.REJECTED,
    });

    await expect(
      synodEngineService.castSynodBallot(bishopClerkId, expiredDecree.id, BallotChoice.APPROVE),
    ).rejects.toMatchObject({
      name: 'CanonicalValidationError',
      message: 'The voting period has closed.',
    });

    expect(mockUpdateDecree).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: expiredDecree.id },
        data: { status: DecreeStatus.REJECTED },
      }),
    );
  });
});
