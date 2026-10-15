import prisma from './db';

export interface AuditLogParams {
  actorId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown> | string;
  ipAddress?: string;
}

export async function logAuditEvent({
  actorId,
  action,
  targetType,
  targetId,
  details,
  ipAddress,
}: AuditLogParams) {
  try {
    const detailsString =
      typeof details === 'object' ? JSON.stringify(details) : details;

    return await prisma.auditLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId,
        details: detailsString,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log entry:', error);
    // Never crash the primary transaction if logging fails, but alert in error logs
    return null;
  }
}
