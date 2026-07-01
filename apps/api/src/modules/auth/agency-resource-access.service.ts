import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Normalized shape returned after a business user has been validated.
 */
export interface BusinessUser {
  officialId: bigint;
  role: 'ADMIN' | 'OFFICIAL';
  agencyId: bigint | null;
  fullName: string;
}

/**
 * Result of asserting access to a case.
 */
export interface CaseAccessResult {
  caseId: bigint;
  agencyId: bigint | null;
  businessUser: BusinessUser;
  caseRow: {
    id: bigint;
    agency_id: bigint | null;
  };
}

/**
 * Result of asserting access to a generated document.
 */
export interface GeneratedDocumentAccessResult {
  documentId: bigint;
  caseId: bigint;
  agencyId: bigint | null;
  businessUser: BusinessUser;
}

/**
 * Result of asserting access to a generated document file.
 */
export interface GeneratedFileAccessResult {
  documentId: bigint;
  fileId: bigint;
  caseId: bigint;
  agencyId: bigint | null;
  businessUser: BusinessUser;
  fileRow: {
    id: bigint;
    generated_document_id: bigint;
    file_path: string;
    file_name: string;
    file_format: string;
  };
}

/**
 * Server-side business authorization for agency-scoped resources.
 *
 * This service enforces:
 * - Only authenticated BUSINESS users (ADMIN or OFFICIAL) may access business APIs.
 * - OFFICIAL users may only access resources in their own agency.
 * - ADMIN users may access resources across all agencies.
 *
 * It does NOT handle authentication — that is the job of AuthGuard.
 */
@Injectable()
export class AgencyResourceAccessService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Require a valid business user (ADMIN or OFFICIAL with numeric official id).
   * Throws UnauthorizedException if no user is present.
   * Throws ForbiddenException if the user is a VIEWER or a Clerk identity.
   */
  requireBusinessUser(
    user:
      | { id: string; role: string; agencyId: string | null; fullName?: string }
      | null
      | undefined,
  ): BusinessUser {
    if (!user) {
      throw new UnauthorizedException('Thiếu thông tin xác thực.');
    }

    if (user.role === 'VIEWER') {
      throw new ForbiddenException(
        'Người dùng Clerk không có quyền truy cập API nghiệp vụ.',
      );
    }

    if (user.role !== 'ADMIN' && user.role !== 'OFFICIAL') {
      throw new ForbiddenException(
        'Vai trò không được hỗ trợ để truy cập API nghiệp vụ.',
      );
    }

    let officialId: bigint;
    try {
      officialId = BigInt(user.id);
    } catch {
      throw new ForbiddenException(
        'Tài khoản không hợp lệ để truy cập API nghiệp vụ.',
      );
    }

    const agencyId: bigint | null = user.agencyId
      ? (() => {
          try {
            return BigInt(user.agencyId!);
          } catch {
            return null;
          }
        })()
      : null;

    return {
      officialId,
      role: user.role,
      agencyId,
      fullName: user.fullName ?? '',
    };
  }

  /**
   * Assert that the given user can access resources of the specified agency.
   * - ADMIN may access any agency.
   * - OFFICIAL must have a non-null agencyId matching the requested agencyId.
   * Throws ForbiddenException if access is denied.
   */
  assertCanAccessAgency(
    user:
      | { id: string; role: string; agencyId: string | null }
      | null
      | undefined,
    agencyId: bigint | null,
  ): BusinessUser {
    const businessUser = this.requireBusinessUser(user);

    if (businessUser.role === 'ADMIN') {
      return businessUser;
    }

    if (agencyId === null) {
      throw new ForbiddenException(
        'Không có quyền truy cập tài nguyên không thuộc cơ quan nào.',
      );
    }

    if (businessUser.agencyId === null || businessUser.agencyId !== agencyId) {
      throw new ForbiddenException(
        'Không có quyền truy cập tài nguyên thuộc cơ quan này.',
      );
    }

    return businessUser;
  }

  /**
   * Assert that the given user can access a specific case.
   * Loads the case, verifies it exists, then checks agency access.
   * Throws NotFoundException if the case does not exist.
   * Throws ForbiddenException if the user cannot access the case's agency.
   */
  async assertCanAccessCase(
    user:
      | { id: string; role: string; agencyId: string | null }
      | null
      | undefined,
    caseIdRaw: string,
  ): Promise<CaseAccessResult> {
    const caseId = this.parsePositiveBigint(caseIdRaw, 'caseId');

    const caseRow = await this.prisma.cases.findFirst({
      where: {
        id: caseId,
        is_deleted: false,
      },
      select: {
        id: true,
        agency_id: true,
      },
    });

    if (!caseRow) {
      throw new NotFoundException('Không tìm thấy hồ sơ.');
    }

    const businessUser = this.assertCanAccessAgency(user, caseRow.agency_id);

    return {
      caseId,
      agencyId: caseRow.agency_id,
      businessUser,
      caseRow,
    };
  }

  /**
   * Assert that the given user can access a generated document by its id.
   * Loads the document and its case to determine agency ownership.
   * Throws NotFoundException if any entity in the chain is missing.
   * Throws ForbiddenException if the user cannot access the document's agency.
   */
  async assertCanAccessGeneratedDocument(
    user:
      | { id: string; role: string; agencyId: string | null }
      | null
      | undefined,
    documentIdRaw: string,
  ): Promise<GeneratedDocumentAccessResult> {
    const documentId = this.parsePositiveBigint(documentIdRaw, 'documentId');

    const documentRow = await this.prisma.generated_documents.findFirst({
      where: { id: documentId },
      select: { id: true, case_id: true },
    });

    if (!documentRow) {
      throw new NotFoundException('Không tìm thấy biểu mẫu đã tạo.');
    }

    const caseRow = await this.prisma.cases.findFirst({
      where: { id: documentRow.case_id },
      select: { id: true, agency_id: true },
    });

    if (!caseRow) {
      throw new NotFoundException('Không tìm thấy hồ sơ liên kết.');
    }

    const businessUser = this.assertCanAccessAgency(user, caseRow.agency_id);

    return {
      documentId,
      caseId: caseRow.id,
      agencyId: caseRow.agency_id,
      businessUser,
    };
  }

  /**
   * Assert that the given user can access a specific generated document file.
   * Loads the file, its parent document, and the case to determine agency ownership.
   * Throws NotFoundException if any entity in the chain is missing.
   * Throws ForbiddenException if the user cannot access the file's agency.
   */
  async assertCanAccessGeneratedDocumentFile(
    user:
      | { id: string; role: string; agencyId: string | null }
      | null
      | undefined,
    documentIdRaw: string,
    fileIdRaw: string,
  ): Promise<GeneratedFileAccessResult> {
    const documentId = this.parsePositiveBigint(documentIdRaw, 'documentId');
    const fileId = this.parsePositiveBigint(fileIdRaw, 'fileId');

    // Load file with its document and the document's case to get agency
    const fileRow = await this.prisma.generated_document_files.findFirst({
      where: {
        id: fileId,
        generated_document_id: documentId,
      },
      select: {
        id: true,
        generated_document_id: true,
        file_path: true,
        file_name: true,
        file_format: true,
      },
    });

    if (!fileRow) {
      throw new NotFoundException('Không tìm thấy file.');
    }

    const documentRow = await this.prisma.generated_documents.findFirst({
      where: { id: documentId },
      select: { id: true, case_id: true },
    });

    if (!documentRow) {
      throw new NotFoundException('Không tìm thấy biểu mẫu đã tạo.');
    }

    const caseRow = await this.prisma.cases.findFirst({
      where: { id: documentRow.case_id },
      select: { id: true, agency_id: true },
    });

    if (!caseRow) {
      throw new NotFoundException('Không tìm thấy hồ sơ liên kết.');
    }

    const businessUser = this.assertCanAccessAgency(user, caseRow.agency_id);

    return {
      documentId,
      fileId,
      caseId: caseRow.id,
      agencyId: caseRow.agency_id,
      businessUser,
      fileRow,
    };
  }

  private parsePositiveBigint(value: string, entityName: string): bigint {
    try {
      const parsed = BigInt(value);
      if (parsed <= 0n) {
        throw new Error('Non-positive');
      }
      return parsed;
    } catch {
      throw new BadRequestException(`${entityName} không hợp lệ.`);
    }
  }
}
