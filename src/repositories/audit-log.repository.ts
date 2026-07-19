import { Prisma, AuditLog } from '@prisma/client';
import prisma from '../lib/prisma';

export interface CreateAuditLogInput {
  actorId: string;
  institutionId: string;
  action: string;
  tableName: string;
  recordId: string;
  changes: Prisma.InputJsonValue;
}

export class AuditLogRepository {
  async create(
    data: CreateAuditLogInput,
    tx?: Prisma.TransactionClient,
  ): Promise<AuditLog> {
    const client = tx ?? prisma;
    return (client.auditLog as any).create({
      data: {
        userId: data.actorId,
        parishId: data.institutionId,
        action: data.action,
        tableAffected: data.tableName,
        recordId: data.recordId,
        newState: data.changes,
      },
    });
  }
}

export const auditLogRepository = new AuditLogRepository();
