import { Injectable, Logger } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUser } from '../auth/current-user.type';

/** Audit action values. */
export const GENERATED_DOCUMENT_AUDIT_ACTIONS = {
  CREATED: 'GENERATED_DOCUMENT_CREATED',
  RENDERED_DOCX: 'GENERATED_DOCUMENT_RENDERED_DOCX',
  EXPORTED: 'GENERATED_DOCUMENT_EXPORTED',
  DOWNLOADED: 'GENERATED_DOCUMENT_DOWNLOADED',
  FILE_DELETED: 'GENERATED_DOCUMENT_FILE_DELETED',
  FILES_BULK_DELETED: 'GENERATED_DOCUMENT_FILES_BULK_DELETED',
  FILES_CLEANED_UP: 'GENERATED_DOCUMENT_FILES_CLEANED_UP',
  ACCESS_DENIED: 'GENERATED_DOCUMENT_ACCESS_DENIED',
} as const;

export type GeneratedDocumentAuditAction =
  (typeof GENERATED_DOCUMENT_AUDIT_ACTIONS)[keyof typeof GENERATED_DOCUMENT_AUDIT_ACTIONS];

/** Audit result values. */
export const GENERATED_DOCUMENT_AUDIT_RESULTS = {
  SUCCESS: 'SUCCESS',
  DENIED: 'DENIED',
  FAILED: 'FAILED',
} as const;

export type GeneratedDocumentAuditResult =
  (typeof GENERATED_DOCUMENT_AUDIT_RESULTS)[keyof typeof GENERATED_DOCUMENT_AUDIT_RESULTS];

/** File kind discriminator derived from file_format column. */
export type FileKind = 'DOCX' | 'PDF' | 'OTHER';

/** Minimal actor snapshot recorded in the audit row. */
export interface AuditActor {
  officialId?: bigint;
  role?: string;
  fullName?: string;
  agencyId?: bigint | null;
}

/** Request metadata — sanitized, never includes tokens or cookies. */
export interface AuditRequestMeta {
  method?: string;
  path?: string;
  ipAddress?: string;
  userAgent?: string;
}

/** Template context snapshot at audit time. */
export interface AuditTemplateContext {
  templateCode?: string | null;
  templateTitle?: string | null;
  contractVersionId?: bigint | null;
}

/** File metadata snapshot captured at audit time (not file contents). */
export interface AuditFileContext {
  fileId?: bigint;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: bigint;
  fileKind?: FileKind;
}

/** Data required to write one audit row. */
export interface WriteAuditEvent {
  action: GeneratedDocumentAuditAction;
  result: GeneratedDocumentAuditResult;
  actor: AuditActor;
  requestMeta?: AuditRequestMeta | null;
  agencyId?: bigint | null;
  caseId?: bigint | null;
  generatedDocumentId?: bigint | null;
  generatedDocumentFileId?: bigint | null;
  file?: AuditFileContext | null;
  template?: AuditTemplateContext | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** Converts file_format to FileKind. */
function fileFormatToKind(fileFormat: string | null | undefined): FileKind {
  switch (fileFormat?.toUpperCase()) {
    case 'DOCX':
      return 'DOCX';
    case 'PDF':
      return 'PDF';
    default:
      return 'OTHER';
  }
}

/** Converts file_format to MIME type string. */
function mimeTypeFromFormat(
  fileFormat: string | null | undefined,
): string | undefined {
  switch (fileFormat?.toUpperCase()) {
    case 'DOCX':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'PDF':
      return 'application/pdf';
    default:
      return undefined;
  }
}

@Injectable()
export class GeneratedDocumentAuditService {
  private readonly logger = new Logger(GeneratedDocumentAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a successful or failed event.
   *
   * Audit write failures are swallowed and logged — the caller MUST NOT throw
   * because of an audit write failure. For compliance purposes the audit row
   * is best-effort; the authoritative record is the business operation itself.
   */
  async record(event: WriteAuditEvent): Promise<void> {
    try {
      await this.prisma.generated_document_audit_logs.create({
        data: {
          action: event.action,
          result: event.result,
          actor_official_id: event.actor.officialId
            ? event.actor.officialId
            : undefined,
          actor_role: event.actor.role,
          actor_name: event.actor.fullName,
          agency_id:
            event.actor.agencyId !== undefined
              ? event.actor.agencyId
              : event.agencyId,
          case_id: event.caseId,
          generated_document_id: event.generatedDocumentId,
          generated_document_file_id:
            event.file?.fileId ?? event.generatedDocumentFileId,
          template_code: event.template?.templateCode,
          template_title: event.template?.templateTitle,
          contract_version_id: event.template?.contractVersionId,
          file_name: event.file?.fileName,
          file_mime_type: event.file?.mimeType,
          file_size_bytes: event.file?.sizeBytes,
          file_kind: event.file?.fileKind,
          request_method: event.requestMeta?.method,
          request_path: event.requestMeta?.path,
          ip_address: event.requestMeta?.ipAddress,
          user_agent: event.requestMeta?.userAgent,
          reason: event.reason,
          metadata_json: (event.metadata as object) ?? undefined,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[AuditWriteFailure] action=${event.action} result=${event.result} error=${message}`,
      );
    }
  }

  /**
   * Extract sanitized request metadata from an Express Request object.
   *
   * Authorization headers, cookies, and bearer tokens are explicitly excluded.
   */
  normalizeRequestMeta(
    req: Request | null | undefined,
  ): AuditRequestMeta | null {
    if (!req) return null;

    const forwarded = req.headers['x-forwarded-for'];
    const ipAddress =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : typeof forwarded === 'string'
          ? forwarded
          : (req.ip ?? req.socket?.remoteAddress);

    return {
      method: req.method,
      path: req.originalUrl,
      ipAddress: ipAddress
        ? String(ipAddress).replace(/^::ffff:/, '')
        : undefined,
      userAgent: req.get('user-agent'),
    };
  }

  /**
   * Build a full AuditActor from a CurrentUser and optional BusinessUser fields.
   */
  buildActor(
    user: CurrentUser | null | undefined,
    opts?: { officialId?: bigint; agencyId?: bigint | null },
  ): AuditActor {
    if (!user) {
      return {
        officialId: opts?.officialId,
        agencyId: opts?.agencyId,
      };
    }

    return {
      officialId: opts?.officialId ?? (user.id ? BigInt(user.id) : undefined),
      role: user.role,
      fullName: user.fullName,
      agencyId:
        opts?.agencyId ?? (user.agencyId ? BigInt(user.agencyId) : null),
    };
  }

  /**
   * Build AuditFileContext from a generated_document_files row.
   */
  buildFileContext(file: {
    id: bigint;
    file_name: string;
    file_format: string;
    file_size_bytes: bigint;
  }): AuditFileContext {
    return {
      fileId: file.id,
      fileName: file.file_name,
      mimeType: mimeTypeFromFormat(file.file_format),
      sizeBytes: file.file_size_bytes,
      fileKind: fileFormatToKind(file.file_format),
    };
  }

  /**
   * Build AuditTemplateContext from a generated_documents row + template lookup.
   */
  buildTemplateContext(doc: {
    template_id: bigint;
    template_version_id?: bigint | null;
  }): AuditTemplateContext {
    return {
      templateCode: String(doc.template_id),
      contractVersionId: doc.template_version_id ?? undefined,
    };
  }

  /**
   * Read audit log entries for a generated document.
   *
   * - ADMIN sees full request metadata.
   * - OFFICIAL sees action/result/actor/time/file/template only.
   * - VIEWER is forbidden at the controller level.
   */
  async readDocumentAudit(params: {
    documentId: bigint;
    actorOfficialId: bigint;
    actorRole: string;
    actorAgencyId: bigint | null;
    limit?: number;
    offset?: number;
  }): Promise<{
    entries: Array<{
      id: string;
      action: string;
      result: string;
      actorOfficialId: string | null;
      actorRole: string | null;
      actorName: string | null;
      agencyId: string | null;
      caseId: string | null;
      generatedDocumentId: string | null;
      generatedDocumentFileId: string | null;
      templateCode: string | null;
      templateTitle: string | null;
      fileName: string | null;
      fileMimeType: string | null;
      fileSizeBytes: string | null;
      reason: string | null;
      createdAt: Date;
      // Only populated for ADMIN
      ipAddress: string | null;
      userAgent: string | null;
      requestMethod: string | null;
      requestPath: string | null;
      metadataJson: Record<string, unknown> | null;
    }>;
    total: number;
  }> {
    const {
      documentId,
      actorRole,
      actorAgencyId,
      limit = 50,
      offset = 0,
    } = params;

    const isAdmin = actorRole === 'ADMIN';

    const where = {
      generated_document_id: documentId,
      ...(isAdmin
        ? {}
        : {
            OR: [
              { agency_id: actorAgencyId },
              { agency_id: null, actor_official_id: params.actorOfficialId },
            ],
          }),
    };

    const [entries, total] = await Promise.all([
      this.prisma.generated_document_audit_logs.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          action: true,
          result: true,
          actor_official_id: true,
          actor_role: true,
          actor_name: true,
          agency_id: true,
          case_id: true,
          generated_document_id: true,
          generated_document_file_id: true,
          template_code: true,
          template_title: true,
          file_name: true,
          file_mime_type: true,
          file_size_bytes: true,
          reason: true,
          created_at: true,
          // Only select request metadata for ADMIN
          ...(isAdmin
            ? {
                ip_address: true,
                user_agent: true,
                request_method: true,
                request_path: true,
                metadata_json: true,
              }
            : {}),
        },
      }),
      this.prisma.generated_document_audit_logs.count({ where }),
    ]);

    return {
      entries: entries.map((e) => ({
        id: String(e.id),
        action: e.action,
        result: e.result,
        actorOfficialId: e.actor_official_id
          ? String(e.actor_official_id)
          : null,
        actorRole: e.actor_role,
        actorName: e.actor_name,
        agencyId: e.agency_id ? String(e.agency_id) : null,
        caseId: e.case_id ? String(e.case_id) : null,
        generatedDocumentId: e.generated_document_id
          ? String(e.generated_document_id)
          : null,
        generatedDocumentFileId: e.generated_document_file_id
          ? String(e.generated_document_file_id)
          : null,
        templateCode: e.template_code,
        templateTitle: e.template_title,
        fileName: e.file_name,
        fileMimeType: e.file_mime_type,
        fileSizeBytes: e.file_size_bytes ? String(e.file_size_bytes) : null,
        reason: e.reason,
        createdAt: e.created_at,
        ipAddress: isAdmin && 'ip_address' in e ? (e.ip_address ?? null) : null,
        userAgent: isAdmin && 'user_agent' in e ? (e.user_agent ?? null) : null,
        requestMethod:
          isAdmin && 'request_method' in e ? (e.request_method ?? null) : null,
        requestPath:
          isAdmin && 'request_path' in e ? (e.request_path ?? null) : null,
        metadataJson:
          isAdmin && 'metadata_json' in e
            ? (e.metadata_json as Record<string, unknown>)
            : null,
      })),
      total,
    };
  }

  /**
   * Record an access-denied event from route parameters only — no resource fields
   * that would leak existence of a cross-agency document or file.
   *
   * The original exception is NOT caught or modified; this method is called from
   * catch blocks after the exception has already been re-thrown or the response
   * is already being sent.
   *
   * Policy: never include fileName, templateTitle, caseTitle, or agencyName
   * for an unauthorized actor unless those fields are already safely known.
   */
  async recordAccessDenied(params: {
    user: CurrentUser | null | undefined;
    request: Request | null | undefined;
    reason: string;
    generatedDocumentId?: string | bigint;
    generatedDocumentFileId?: string | bigint;
    metadata?: Record<string, unknown> | null;
  }): Promise<void> {
    const {
      user,
      request,
      reason,
      generatedDocumentId,
      generatedDocumentFileId,
      metadata,
    } = params;

    const actor = this.buildActor(user);

    const record: WriteAuditEvent = {
      action: GENERATED_DOCUMENT_AUDIT_ACTIONS.ACCESS_DENIED,
      result: GENERATED_DOCUMENT_AUDIT_RESULTS.DENIED,
      actor,
      requestMeta: this.normalizeRequestMeta(request),
      generatedDocumentId: generatedDocumentId
        ? typeof generatedDocumentId === 'string'
          ? BigInt(generatedDocumentId)
          : generatedDocumentId
        : undefined,
      generatedDocumentFileId: generatedDocumentFileId
        ? typeof generatedDocumentFileId === 'string'
          ? BigInt(generatedDocumentFileId)
          : generatedDocumentFileId
        : undefined,
      reason,
      metadata: metadata ?? undefined,
    };

    await this.record(record);
  }
}
