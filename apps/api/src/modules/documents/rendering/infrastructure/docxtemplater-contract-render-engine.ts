import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { WorkspacePathsService } from '../../../../infrastructure/paths/workspace-paths.service';
import type { ContractRenderPlan } from '../domain/contract-render-plan';
import {
  auditDocxFormat,
  extractOoxmlPartsFromDocx,
} from './docx-format-auditor';
import {
  compareDocxSemantic,
  extractDocumentXmlFromZip,
} from './docx-semantic-comparator';
import {
  auditDocxPackageIntegrity,
  renderDocxTemplate,
} from './docx-template-renderer';

export type ShadowArtifactPath = Readonly<{
  docxPath: string;
  semanticDiffJsonPath: string;
  semanticDiffMdPath: string;
  formatAuditJsonPath: string;
  formatAuditMdPath: string;
  packageIntegrityJsonPath: string;
  packageIntegrityMdPath: string;
  manifestPath: string;
}>;

export type ShadowRenderResult = Readonly<{
  shadowPath: string;
  artifacts: ShadowArtifactPath;
  semanticComparison: ReturnType<typeof compareDocxSemantic>;
  formatAudit: ReturnType<typeof auditDocxFormat>;
  packageIntegrity: ReturnType<typeof auditDocxPackageIntegrity>;
}>;

export type ActiveRenderArtifact = Readonly<{
  fileName: string;
  docxPath: string;
  manifestPath: string;
  checksum: string;
  bytes: number;
}>;

interface ShadowManifest {
  documentId: string;
  templateCode: string;
  timestamp: string;
  renderPlan: {
    sourceId: string;
    contractStatus: string;
    fieldCount: number;
    bindingCount: number;
    missingRequiredCount: number;
    warnings: string[];
  };
  artifacts: {
    docx: string;
    semanticDiffJson: string;
    semanticDiffMd: string;
    formatAuditJson: string;
    formatAuditMd: string;
    packageIntegrityJson: string;
    packageIntegrityMd: string;
  };
  semanticComparison: {
    status: string;
    legacyTextLength: number;
    contractTextLength: number;
    missingExpectedText: string[];
    unexpectedUnresolvedPlaceholders: string[];
    unexpectedLiteralValues: string[];
    notes: string[];
  };
  formatAudit: {
    status: string;
    checks: Array<{
      id: string;
      requirement: string;
      status: string;
      evidence?: string;
    }>;
  };
  packageIntegrity: {
    status: string;
    missingParts: string[];
    changedPreservedParts: string[];
  };
}

@Injectable()
export class DocxtemplaterContractRenderEngine {
  private readonly logger = new Logger(DocxtemplaterContractRenderEngine.name);

  constructor(private readonly workspace: WorkspacePathsService) {}

  async renderShadow(
    plan: ContractRenderPlan,
    formData: Record<string, unknown>,
    outputDir: string,
  ): Promise<ShadowRenderResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const shadowDir = join(outputDir, plan.templateCode, timestamp);
    mkdirSync(shadowDir, { recursive: true });

    const contractDocx = await this.loadTemplate(plan.templateCode);

    const bindingMap = new Map(plan.bindings.map((b) => [b.slotId, b.value]));
    // Fallback for unbound DOCX placeholders: also fill from raw formData.
    // The locked contract may reject certain namespaces (e.g. crimeReport.*
    // in BM-001), but the underlying DOCX template still has those
    // placeholders from the original .doc source. Without this fallback,
    // Docxtemplater would emit literal "undefined" text for every unbound
    // placeholder. We only add formData values for keys that the contract
    // did not bind, so a binding whose value is explicitly empty stays
    // empty (used by the semantic-comparison tests). This mirrors the
    // behaviour already present in renderActiveDocx().
    const boundKeys = new Set(plan.bindings.map((b) => b.slotId));
    for (const [key, value] of Object.entries(formData)) {
      if (boundKeys.has(key)) continue;
      if (value !== undefined && value !== null && value !== '') {
        bindingMap.set(key, String(value));
      }
    }

    const renderedDocx = await this.fillTemplate(contractDocx, bindingMap);

    const docxPath = join(shadowDir, 'contract.docx');
    writeFileSync(docxPath, renderedDocx);

    const legacyDocx = await this.loadTemplate(plan.templateCode);
    const [legacyDocumentXml, renderedDocumentXml] = await Promise.all([
      extractDocumentXmlFromZip(legacyDocx),
      extractDocumentXmlFromZip(renderedDocx),
    ]);
    const semanticComparison = compareDocxSemantic(
      legacyDocumentXml,
      renderedDocumentXml,
      this.extractExpectedValues(plan, formData),
    );

    const semanticDiffJsonPath = join(shadowDir, 'semantic-diff.json');
    writeFileSync(
      semanticDiffJsonPath,
      JSON.stringify(semanticComparison, null, 2),
    );

    const semanticDiffMdPath = join(shadowDir, 'semantic-diff.md');
    writeFileSync(
      semanticDiffMdPath,
      this.formatSemanticDiffMd(semanticComparison),
    );

    const formatAudit = await this.auditRenderedDocx(renderedDocx);

    const formatAuditJsonPath = join(shadowDir, 'format-audit.json');
    writeFileSync(formatAuditJsonPath, JSON.stringify(formatAudit, null, 2));

    const formatAuditMdPath = join(shadowDir, 'format-audit.md');
    writeFileSync(formatAuditMdPath, this.formatAuditMd(formatAudit));

    const packageIntegrity = auditDocxPackageIntegrity(
      contractDocx,
      renderedDocx,
    );
    const packageIntegrityJsonPath = join(shadowDir, 'package-integrity.json');
    writeFileSync(
      packageIntegrityJsonPath,
      JSON.stringify(packageIntegrity, null, 2),
    );
    const packageIntegrityMdPath = join(shadowDir, 'package-integrity.md');
    writeFileSync(
      packageIntegrityMdPath,
      this.formatPackageIntegrityMd(packageIntegrity),
    );

    const manifest: ShadowManifest = {
      documentId: plan.sourceId,
      templateCode: plan.templateCode,
      timestamp,
      renderPlan: {
        sourceId: plan.sourceId,
        contractStatus: plan.contractStatus,
        fieldCount: plan.fields.length,
        bindingCount: plan.bindings.length,
        missingRequiredCount: plan.missingRequired.length,
        warnings: [...plan.warnings],
      },
      artifacts: {
        docx: docxPath,
        semanticDiffJson: semanticDiffJsonPath,
        semanticDiffMd: semanticDiffMdPath,
        formatAuditJson: formatAuditJsonPath,
        formatAuditMd: formatAuditMdPath,
        packageIntegrityJson: packageIntegrityJsonPath,
        packageIntegrityMd: packageIntegrityMdPath,
      },
      semanticComparison: {
        status: semanticComparison.status,
        legacyTextLength: semanticComparison.legacyTextLength,
        contractTextLength: semanticComparison.contractTextLength,
        missingExpectedText: [...semanticComparison.missingExpectedText],
        unexpectedUnresolvedPlaceholders: [
          ...semanticComparison.unexpectedUnresolvedPlaceholders,
        ],
        unexpectedLiteralValues: [
          ...semanticComparison.unexpectedLiteralValues,
        ],
        notes: [...semanticComparison.notes],
      },
      formatAudit: {
        status: formatAudit.status,
        checks: formatAudit.checks.map((c) => ({
          id: c.id,
          requirement: c.requirement,
          status: c.status,
          evidence: c.evidence,
        })),
      },
      packageIntegrity: {
        status: packageIntegrity.status,
        missingParts: [...packageIntegrity.missingParts],
        changedPreservedParts: [...packageIntegrity.changedPreservedParts],
      },
    };

    const manifestPath = join(shadowDir, 'manifest.json');
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    return Object.freeze({
      shadowPath: shadowDir,
      artifacts: Object.freeze({
        docxPath,
        semanticDiffJsonPath,
        semanticDiffMdPath,
        formatAuditJsonPath,
        formatAuditMdPath,
        packageIntegrityJsonPath,
        packageIntegrityMdPath,
        manifestPath,
      }),
      semanticComparison,
      formatAudit,
      packageIntegrity,
    });
  }

  async renderActiveDocx(
    plan: ContractRenderPlan,
    formData: Record<string, unknown>,
  ): Promise<Buffer> {
    const contractDocx = await this.loadTemplate(plan.templateCode);
    const bindingMap = new Map(plan.bindings.map((b) => [b.slotId, b.value]));
    for (const [key, value] of Object.entries(formData)) {
      if (value !== undefined && value !== null && value !== '') {
        bindingMap.set(key, String(value));
      }
    }
    return this.fillTemplate(contractDocx, bindingMap);
  }

  async persistActiveRender(
    plan: ContractRenderPlan,
    renderedDocx: Buffer,
    outputRoot: string,
  ): Promise<ActiveRenderArtifact> {
    const timestamp = buildTimestampForFileName();
    const safeCaseDir = 'document-' + plan.templateCode.toLowerCase();
    const outputDir = join(outputRoot, safeCaseDir);
    mkdirSync(outputDir, { recursive: true });

    const fileName = `${plan.templateCode}_active_${timestamp}.docx`;
    const outputPath = join(outputDir, fileName);
    writeFileSync(outputPath, renderedDocx);

    const manifestPath = join(
      outputDir,
      `${plan.templateCode}_active_${timestamp}.manifest.json`,
    );
    const checksum = sha256(renderedDocx);
    const manifest = {
      templateCode: plan.templateCode,
      sourceId: plan.sourceId,
      contractStatus: plan.contractStatus,
      fieldCount: plan.fields.length,
      bindingCount: plan.bindings.length,
      timestamp,
      fileName,
      checksum,
      bytes: renderedDocx.length,
      missingRequiredCount: plan.missingRequired.length,
      warnings: [...plan.warnings],
    };
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    return Object.freeze({
      fileName,
      docxPath: outputPath,
      manifestPath,
      checksum,
      bytes: renderedDocx.length,
    });
  }

  private async loadTemplate(templateCode: string): Promise<Buffer> {
    const normalizedTemplateRoot = join(
      this.workspace.normalizedTemplatesRoot,
      templateCode,
    );

    const templatePath = join(
      normalizedTemplateRoot,
      `${templateCode}_normalized.docx`,
    );

    if (!existsSync(templatePath)) {
      throw new Error(
        `Normalized template for "${templateCode}" not found at "${templatePath}". ` +
          'Ensure the normalized DOCX exists in storage/templates/normalized-docx/.',
      );
    }

    return readFileSync(templatePath);
  }

  private async fillTemplate(
    templateBuffer: Buffer,
    bindings: Map<string, unknown>,
  ): Promise<Buffer> {
    return renderDocxTemplate(templateBuffer, bindings);
  }

  private async auditRenderedDocx(docxBuffer: Buffer) {
    try {
      const parts = await extractOoxmlPartsFromDocx(docxBuffer);
      return auditDocxFormat(parts);
    } catch (error) {
      this.logger.error(
        `Format audit failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        status: 'warning' as const,
        checks: [],
      };
    }
  }

  private extractExpectedValues(
    plan: ContractRenderPlan,
    formData: Record<string, unknown>,
  ): string[] {
    const values = new Set<string>();

    for (const binding of plan.bindings) {
      const value = formData[binding.from] ?? binding.value;
      if (typeof value === 'string' && value.trim()) {
        values.add(value.trim());
      }
    }

    return [...values];
  }

  private formatSemanticDiffMd(
    comparison: ReturnType<typeof compareDocxSemantic>,
  ): string {
    const lines: string[] = [
      '# DOCX Semantic Diff',
      '',
      `**Status**: \`${comparison.status}\``,
      '',
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Legacy text length | ${comparison.legacyTextLength} |`,
      `| Contract text length | ${comparison.contractTextLength} |`,
      '',
    ];

    if (comparison.missingExpectedText.length > 0) {
      lines.push('## Missing Expected Text');
      for (const text of comparison.missingExpectedText) {
        lines.push(`- "${text}"`);
      }
      lines.push('');
    }

    if (comparison.unexpectedUnresolvedPlaceholders.length > 0) {
      lines.push('## Unexpected Unresolved Placeholders');
      for (const p of comparison.unexpectedUnresolvedPlaceholders) {
        lines.push(`- \`${p}\``);
      }
      lines.push('');
    }

    if (comparison.unexpectedLiteralValues.length > 0) {
      lines.push('## Unexpected Literal Values');
      for (const value of comparison.unexpectedLiteralValues) {
        lines.push(`- \`${value}\``);
      }
      lines.push('');
    }

    if (comparison.notes.length > 0) {
      lines.push('## Notes');
      for (const note of comparison.notes) {
        lines.push(`- ${note}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  private formatAuditMd(audit: ReturnType<typeof auditDocxFormat>): string {
    const lines: string[] = [
      '# DOCX Format Audit',
      '',
      `**Overall Status**: \`${audit.status}\``,
      '',
      '| Check ID | Requirement | Status | Evidence |',
      '|----------|-------------|--------|---------|',
    ];

    for (const check of audit.checks) {
      const evidence = check.evidence ?? '-';
      lines.push(
        `| ${check.id} | ${check.requirement} | \`${check.status}\` | ${evidence} |`,
      );
    }

    return lines.join('\n');
  }

  private formatPackageIntegrityMd(
    integrity: ReturnType<typeof auditDocxPackageIntegrity>,
  ): string {
    const lines = [
      '# DOCX Package Integrity',
      '',
      `**Status**: \`${integrity.status}\``,
      '',
      `- Missing parts: ${integrity.missingParts.length}`,
      `- Changed preserved parts: ${integrity.changedPreservedParts.length}`,
    ];

    if (integrity.missingParts.length > 0) {
      lines.push('', '## Missing Parts');
      for (const part of integrity.missingParts) lines.push(`- \`${part}\``);
    }

    if (integrity.changedPreservedParts.length > 0) {
      lines.push('', '## Changed Preserved Parts');
      for (const part of integrity.changedPreservedParts) {
        lines.push(`- \`${part}\``);
      }
    }

    return lines.join('\n');
  }
}

function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function buildTimestampForFileName(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const datePart = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('');
  const timePart = [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
  return `${datePart}-${timePart}`;
}
