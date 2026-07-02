import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { WorkspacePathsService } from '../../infrastructure/paths/workspace-paths.service';
import { StandaloneTemplateRenderService } from './rendering/application/standalone-template-render.service';
import { DocxStyleAuditService } from './style/docx-style-audit.service';
import type { DocxStyleAuditResult } from './style/docx-style-audit.service';
import { DocumentPdfService } from './document-pdf.service';

const RUNTIME_PREVIEW_SESSIONS_DIR = 'runtime-preview-sessions';
const SESSION_TTL_MS = 60 * 60 * 1000; // 60 minutes

const SESSION_ID_PATTERN = /^runtime_preview_[a-f0-9-]{36}$/u;

const PDF_PREVIEW_UNAVAILABLE_WARNING = {
  code: 'PDF_PREVIEW_UNAVAILABLE',
  message:
    'Khong tao duoc PDF preview trong moi truong hien tai. Vui long tai DOCX de kiem tra dinh dang.',
};

function isValidSessionId(id: string): boolean {
  return SESSION_ID_PATTERN.test(id);
}

function sanitizeSessionId(raw: string): string {
  const trimmed = raw.trim();
  if (!isValidSessionId(trimmed)) {
    throw new BadRequestException('Invalid session ID format.');
  }
  return trimmed;
}

function isPathInside(childPath: string, parentDir: string): boolean {
  const resolvedChild = path.resolve(childPath);
  const resolvedParent = path.resolve(parentDir);
  return (
    resolvedChild === resolvedParent ||
    resolvedChild.startsWith(resolvedParent + path.sep)
  );
}

export interface CreatePreviewSessionInput {
  templateCode: string;
  data?: Record<string, unknown>;
}

export interface RuntimePreviewWarning {
  code: string;
  message: string;
}

export type RuntimePreviewWarningItem = string | RuntimePreviewWarning;

export interface RuntimePreviewSession {
  sessionId: string;
  templateCode: string;
  fileName: string;
  fileSizeBytes: number;
  fileFormat: 'DOCX';
  docxDownloadUrl: string;
  pdfPreviewUrl: string | null;
  audit: {
    status: 'PASS' | 'WARN' | 'FAIL';
    summary: {
      total?: number;
      pass?: number;
      warning?: number;
      fail?: number;
      notDetectable?: number;
      notApplicable?: number;
    };
    findings: Array<{
      severity: 'INFO' | 'WARN' | 'FAIL';
      code: string;
      message: string;
      location: string;
      recommendation?: string;
      sourceCheckId?: string;
    }>;
  };
  warnings: RuntimePreviewWarningItem[];
  missingRequired: unknown[];
  expiresAt: string;
  persisted: false;
}

export interface SessionStore {
  sessionId: string;
  templateCode: string;
  fileName: string;
  docxPath: string;
  pdfPath: string | null;
  auditResult: DocxStyleAuditResult | null;
  warnings: RuntimePreviewWarningItem[];
  missingRequired: unknown[];
  createdAt: number;
  expiresAt: number;
}

@Injectable()
export class RuntimePreviewSessionService {
  private readonly sessionsBaseDir: string;

  constructor(
    private readonly workspacePaths: WorkspacePathsService,
    private readonly standaloneRenderer: StandaloneTemplateRenderService,
    private readonly docxStyleAudit: DocxStyleAuditService,
    private readonly documentPdfService: DocumentPdfService,
  ) {
    this.sessionsBaseDir = path.join(
      this.workspacePaths.storageRoot,
      RUNTIME_PREVIEW_SESSIONS_DIR,
    );
    fs.mkdirSync(this.sessionsBaseDir, { recursive: true });
  }

  async createPreviewSession(
    input: CreatePreviewSessionInput,
  ): Promise<RuntimePreviewSession> {
    const sessionId = `runtime_preview_${randomUUID()}`;
    const sessionDir = path.join(this.sessionsBaseDir, sessionId);
    fs.mkdirSync(sessionDir, { recursive: true });

    const renderResult = await this.standaloneRenderer.renderDocx({
      templateCode: input.templateCode,
      data: input.data ?? {},
    });

    const fileName = renderResult.fileName;
    const docxPath = path.join(sessionDir, 'document.docx');
    fs.writeFileSync(docxPath, renderResult.buffer);

    let auditResult: DocxStyleAuditResult | null = null;
    try {
      auditResult = await this.docxStyleAudit.auditDocxFromFile(docxPath);
    } catch {
      // Audit is best-effort; do not fail the session creation
    }

    const now = Date.now();
    const expiresAt = now + SESSION_TTL_MS;

    const warnings: RuntimePreviewWarningItem[] = [...renderResult.warnings];
    const targetPdfPath = path.join(sessionDir, 'document.pdf');
    let pdfPath: string | null = targetPdfPath;

    try {
      await this.documentPdfService.convertDocxFileToPdf({
        sourceDocxPath: docxPath,
        targetPdfPath,
        contextId: `runtime-preview:${sessionId}`,
      });

      if (!fs.existsSync(targetPdfPath)) {
        pdfPath = null;
        warnings.push(PDF_PREVIEW_UNAVAILABLE_WARNING);
      }
    } catch {
      pdfPath = null;
      warnings.push(PDF_PREVIEW_UNAVAILABLE_WARNING);
      try {
        if (fs.existsSync(targetPdfPath)) {
          fs.unlinkSync(targetPdfPath);
        }
      } catch {
        // Best-effort cleanup; DOCX session remains valid.
      }
    }

    const metadata: SessionStore = {
      sessionId,
      templateCode: renderResult.templateCode,
      fileName,
      docxPath,
      pdfPath,
      auditResult,
      warnings,
      missingRequired: [...renderResult.missingRequired],
      createdAt: now,
      expiresAt,
    };

    const metadataPath = path.join(sessionDir, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    this.cleanupExpiredSessions();

    return this.buildSessionResponse(metadata, auditResult);
  }

  async getSession(sessionId: string): Promise<SessionStore> {
    const id = sanitizeSessionId(sessionId);
    const sessionDir = path.join(this.sessionsBaseDir, id);
    const metadataPath = path.join(sessionDir, 'metadata.json');

    if (!fs.existsSync(metadataPath)) {
      throw new NotFoundException('Preview session not found or expired.');
    }

    const raw = fs.readFileSync(metadataPath, 'utf-8');
    const session: SessionStore = JSON.parse(raw);

    if (Date.now() > session.expiresAt) {
      this.deleteSessionDir(id);
      throw new NotFoundException('Preview session has expired.');
    }

    return session;
  }

  async getSessionDocxPath(sessionId: string): Promise<string> {
    const session = await this.getSession(sessionId);

    if (!fs.existsSync(session.docxPath)) {
      throw new NotFoundException('DOCX file not found for this session.');
    }

    return session.docxPath;
  }

  async getSessionPdfPath(
    sessionId: string,
  ): Promise<{ pdfPath: string; available: boolean }> {
    const id = sanitizeSessionId(sessionId);
    const session = await this.getSession(id);
    const pdfPath = session.pdfPath ?? '';
    const sessionDir = path.join(this.sessionsBaseDir, id);

    if (pdfPath && !isPathInside(pdfPath, sessionDir)) {
      throw new NotFoundException('PDF file not found for this session.');
    }

    return {
      pdfPath,
      available: Boolean(pdfPath) && fs.existsSync(pdfPath),
    };
  }

  private buildSessionResponse(
    session: SessionStore,
    auditResult: DocxStyleAuditResult | null,
  ): RuntimePreviewSession {
    const audit = auditResult
      ? {
          status: auditResult.status,
          summary: auditResult.summary,
          findings: auditResult.findings,
        }
      : {
          status: 'PASS' as const,
          summary: {
            total: 0,
            pass: 0,
            warning: 0,
            fail: 0,
            notDetectable: 0,
            notApplicable: 0,
          },
          findings: [],
        };

    return {
      sessionId: session.sessionId,
      templateCode: session.templateCode,
      fileName: session.fileName,
      fileSizeBytes: fs.statSync(session.docxPath).size,
      fileFormat: 'DOCX',
      docxDownloadUrl: `/api/v1/forms/runtime/preview-sessions/${session.sessionId}/docx`,
      pdfPreviewUrl:
        session.pdfPath && fs.existsSync(session.pdfPath)
          ? `/api/v1/forms/runtime/preview-sessions/${session.sessionId}/pdf`
          : null,
      audit,
      warnings: session.warnings,
      missingRequired: session.missingRequired,
      expiresAt: new Date(session.expiresAt).toISOString(),
      persisted: false,
    };
  }

  private cleanupExpiredSessions(): void {
    try {
      const entries = fs.readdirSync(this.sessionsBaseDir, {
        withFileTypes: true,
      });
      const now = Date.now();

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const sessionId = entry.name;
        if (!isValidSessionId(sessionId)) {
          this.deleteSessionDir(sessionId);
          continue;
        }

        const metadataPath = path.join(
          this.sessionsBaseDir,
          sessionId,
          'metadata.json',
        );
        if (!fs.existsSync(metadataPath)) {
          this.deleteSessionDir(sessionId);
          continue;
        }

        try {
          const raw = fs.readFileSync(metadataPath, 'utf-8');
          const session: SessionStore = JSON.parse(raw);
          if (now > session.expiresAt) {
            this.deleteSessionDir(sessionId);
          }
        } catch {
          this.deleteSessionDir(sessionId);
        }
      }
    } catch {
      // Best-effort cleanup; do not fail on errors
    }
  }

  private deleteSessionDir(sessionId: string): void {
    const sessionDir = path.join(this.sessionsBaseDir, sessionId);
    try {
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      }
    } catch {
      // Best-effort deletion
    }
  }
}
