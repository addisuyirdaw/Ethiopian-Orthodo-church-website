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
    return client.auditLog.create({
      data: {
        actorId: data.actorId,
        institutionId: data.institutionId,
        action: data.action,
        tableName: data.tableName,
        recordId: data.recordId,
        changes: data.changes,
      },
    });
  }
}

export const auditLogRepository = new AuditLogRepository();
