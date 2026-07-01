# AUTH GOVERNANCE PHASE 1 — DB SCHEMA PLAN

**Date:** 2026-06-30
**Phase:** Phase 7 — DB Schema Plan (PATCHED: Phase 1B)
**Provider:** Clerk (user-confirmed)

> **Design only.** Do NOT edit Prisma schema, run migrations, or apply changes. This document defines the target schema for implementation PR-2.

---

## 0. Design Principles

- **Keep `officials` as the primary user table.**
- **QUANLYVKS DB is the authoritative source for business permissions.** Clerk is identity only.
- **All new tables use MariaDB-compatible SQL.** Prisma schema generation must follow this design.
- **No FK from `webhook_events` to `officials`.** Webhook events are provider-scoped, not user-scoped.

---

## 1. New Tables

### 1.1 `officials` — Extended User Table

**Minimum columns (existing + new):**

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT UNSIGNED AUTO_INCREMENT | Primary key |
| `email` | VARCHAR(255) | Primary email |
| `display_name` | VARCHAR(255) | Display name |
| `status` | ENUM('ACTIVE','DISABLED','INVITED') | Account status |
| `created_at` | DATETIME(0) | Creation timestamp |
| `updated_at` | DATETIME(0) | Last update timestamp |
| `last_login_at` | DATETIME(0) | Last successful login |

> **Note:** `role` column on `officials` is deprecated. Role assignment moves to `membership_roles` table.

---

### 1.2 `auth_identities` — Provider Identity Mapping

```sql
CREATE TABLE auth_identities (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider VARCHAR(50) NOT NULL COMMENT 'clerk, auth0, local',
  provider_user_id VARCHAR(255) NOT NULL COMMENT 'Provider user ID (sub)',
  user_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to officials',
  provider_org_id VARCHAR(255) NULL COMMENT 'Provider org ID at time of sync',
  email_snapshot VARCHAR(255) NULL COMMENT 'Cached email at sync time',
  created_at DATETIME(0) NOT NULL DEFAULT NOW(0),
  updated_at DATETIME(0) NOT NULL DEFAULT NOW(0) ON UPDATE NOW(0),

  UNIQUE INDEX uq_auth_identity_provider_user (provider, provider_user_id),
  INDEX idx_auth_identity_user (user_id),
  INDEX idx_auth_identity_email (email_snapshot),

  CONSTRAINT fk_auth_identity_user
    FOREIGN KEY (user_id) REFERENCES officials(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT 'Maps external auth provider users to local officials';
```

**Notes:**
- `provider_user_id` is the Clerk user ID (sub claim from JWT).
- One official can have multiple auth identities (e.g., Clerk + future Auth0).
- `email_snapshot` caches email at sync time for audit purposes.

---

### 1.3 `agencies` — Extended Organization Table

**New columns to add to existing `agencies` table:**

| Column | Type | Description |
|--------|------|-------------|
| `clerk_org_id` | VARCHAR(255) NULL | Maps to Clerk Organization (UNIQUE) |
| `status` | ENUM('ACTIVE','INACTIVE') | Agency status |

---

### 1.4 `agency_memberships` — User-Agency Mapping

```sql
CREATE TABLE agency_memberships (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to officials',
  agency_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to agencies',
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE, SUSPENDED',
  joined_at DATETIME(0) NOT NULL DEFAULT NOW(0),
  created_at DATETIME(0) NOT NULL DEFAULT NOW(0),
  updated_at DATETIME(0) NOT NULL DEFAULT NOW(0) ON UPDATE NOW(0),

  UNIQUE INDEX uq_membership_user_agency (user_id, agency_id),
  INDEX idx_membership_user (user_id),
  INDEX idx_membership_agency (agency_id),

  CONSTRAINT fk_membership_user
    FOREIGN KEY (user_id) REFERENCES officials(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_membership_agency
    FOREIGN KEY (agency_id) REFERENCES agencies(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT 'Maps officials to agencies';
```

> **Note:** `provider_membership_id` removed. Use `membership_roles` for role assignment instead.

---

### 1.5 `roles` — Role Catalog

```sql
CREATE TABLE roles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE COMMENT 'SYSTEM_ADMIN, PERMISSION_ADMIN, etc.',
  description VARCHAR(500) NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'System roles cannot be deleted',
  created_at DATETIME(0) NOT NULL DEFAULT NOW(0),
  updated_at DATETIME(0) NOT NULL DEFAULT NOW(0) ON UPDATE NOW(0),

  INDEX idx_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT 'Role catalog';
```

---

### 1.6 `permissions` — Permission Catalog

```sql
CREATE TABLE permissions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE COMMENT 'case:read, document:export-docx, etc.',
  description VARCHAR(500) NULL,
  category VARCHAR(50) NULL COMMENT 'cases, documents, templates, admin, reports',
  created_at DATETIME(0) NOT NULL DEFAULT NOW(0),

  INDEX idx_permissions_code (code),
  INDEX idx_permissions_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT 'Permission catalog';
```

---

### 1.7 `role_permissions` — Role-Permission Mapping

```sql
CREATE TABLE role_permissions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to roles',
  permission_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to permissions',
  created_at DATETIME(0) NOT NULL DEFAULT NOW(0),

  UNIQUE INDEX uq_role_permission (role_id, permission_id),

  CONSTRAINT fk_role_permission_role
    FOREIGN KEY (role_id) REFERENCES roles(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_role_permission_permission
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT 'Defines which permissions each role has';
```

---

### 1.8 `membership_roles` — Agency Membership Role Assignment

```sql
CREATE TABLE membership_roles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  membership_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to agency_memberships',
  role_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to roles',
  assigned_by BIGINT UNSIGNED NULL COMMENT 'FK to officials who assigned',
  assigned_at DATETIME(0) NOT NULL DEFAULT NOW(0),

  UNIQUE INDEX uq_membership_role (membership_id, role_id),

  CONSTRAINT fk_membership_role_membership
    FOREIGN KEY (membership_id) REFERENCES agency_memberships(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_membership_role_role
    FOREIGN KEY (role_id) REFERENCES roles(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_membership_role_assigner
    FOREIGN KEY (assigned_by) REFERENCES officials(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT 'Assigns roles to agency memberships';
```

---

### 1.9 `provider_webhook_events` — Idempotent Webhook Processing

```sql
CREATE TABLE provider_webhook_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider VARCHAR(50) NOT NULL COMMENT 'clerk, auth0',
  event_id VARCHAR(255) NOT NULL COMMENT 'Provider event ID (for idempotency)',
  event_type VARCHAR(100) NOT NULL COMMENT 'user.created, user.updated, etc.',
  payload_hash VARCHAR(64) NOT NULL COMMENT 'SHA-256 of raw payload',
  status VARCHAR(20) NOT NULL DEFAULT 'PROCESSING' COMMENT 'PROCESSING, PROCESSED, FAILED',
  processed_at DATETIME(0) NULL COMMENT 'When processing completed',
  error_message TEXT NULL COMMENT 'Error details if failed',
  created_at DATETIME(0) NOT NULL DEFAULT NOW(0),

  UNIQUE INDEX uq_webhook_provider_event (provider, event_id),
  INDEX idx_webhook_status (status, created_at),
  INDEX idx_webhook_type (event_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT 'Stores webhook events for idempotent processing';
```

> **Critical:** No FK from this table to `officials`. Webhook events are provider-scoped. Processing logic maps to officials by `provider_user_id`.

---

### 1.10 `audit_logs` — Extended Audit Trail

**Add columns to existing `audit_logs` table:**

```sql
ALTER TABLE audit_logs
  ADD COLUMN user_id BIGINT UNSIGNED NULL
    COMMENT 'FK to officials (actor)',
  ADD COLUMN agency_id BIGINT UNSIGNED NULL
    COMMENT 'FK to agencies (agency context at time of action)',
  ADD COLUMN actor_provider VARCHAR(50) NULL
    COMMENT 'clerk, auth0, local (auth provider)',
  ADD COLUMN actor_provider_id VARCHAR(255) NULL
    COMMENT 'External provider user ID',
  ADD COLUMN request_id VARCHAR(255) NULL
    COMMENT 'Unique request ID for tracing',
  ADD COLUMN before_hash VARCHAR(64) NULL
    COMMENT 'SHA-256 of state before change',
  ADD COLUMN after_hash VARCHAR(64) NULL
    COMMENT 'SHA-256 of state after change',
  ADD COLUMN metadata_json JSON NULL
    COMMENT 'Additional structured metadata',
  ADD COLUMN is_immutable BOOLEAN NOT NULL DEFAULT FALSE
    COMMENT 'Immutable events cannot be deleted',
  ADD COLUMN expires_at DATETIME(0) NULL
    COMMENT 'When to purge (NULL = never)';

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_agency ON audit_logs(agency_id);
CREATE INDEX idx_audit_logs_provider ON audit_logs(actor_provider, actor_provider_id);
CREATE INDEX idx_audit_logs_immutable ON audit_logs(is_immutable, created_at);
```

---

### 1.11 `export_history` — Document Export Traceability

```sql
CREATE TABLE export_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  document_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to generated_documents',
  template_code VARCHAR(100) NULL COMMENT 'Template code at export time',
  case_id BIGINT UNSIGNED NULL COMMENT 'FK to cases',
  user_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to officials',
  agency_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to agencies',
  format VARCHAR(20) NOT NULL COMMENT 'DOCX, PDF',

  -- Traceability hashes
  input_snapshot_hash VARCHAR(64) NULL COMMENT 'SHA-256 of form inputs at export',
  contract_hash VARCHAR(64) NULL COMMENT 'SHA-256 of form contract version',
  exported_file_hash VARCHAR(64) NULL COMMENT 'SHA-256 of exported file',
  exported_file_size_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,

  -- File storage trace
  exported_file_path VARCHAR(1000) NULL COMMENT 'Path to exported file',
  exported_file_name VARCHAR(500) NULL COMMENT 'Original file name',

  -- Context
  ip_address VARCHAR(100) NULL,
  user_agent TEXT NULL,
  metadata_json JSON NULL COMMENT 'Additional export context',

  created_at DATETIME(0) NOT NULL DEFAULT NOW(0),

  INDEX idx_export_document (document_id),
  INDEX idx_export_user (user_id),
  INDEX idx_export_agency (agency_id),
  INDEX idx_export_case (case_id),
  INDEX idx_export_template (template_code),
  INDEX idx_export_created (created_at),
  INDEX idx_export_contract_hash (contract_hash),

  CONSTRAINT fk_export_document
    FOREIGN KEY (document_id) REFERENCES generated_documents(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_export_user
    FOREIGN KEY (user_id) REFERENCES officials(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_export_agency
    FOREIGN KEY (agency_id) REFERENCES agencies(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT 'Tracks all document exports for legal compliance';
```

**Notes:**
- `input_snapshot_hash` proves form state at export time.
- `contract_hash` proves which form contract version was used.
- `exported_file_hash` proves file integrity.
- All three hashes together prove document lineage.

---

## 2. Data Retention Policy

| Table | Retention | Reason |
|-------|-----------|--------|
| `auth_identities` | Permanent | User identity mapping must persist |
| `agencies` | Permanent | Organization data |
| `agency_memberships` | Permanent | Agency membership history |
| `roles` | Permanent | Role catalog |
| `permissions` | Permanent | Permission catalog |
| `role_permissions` | Permanent | Role-permission assignments |
| `membership_roles` | Permanent | Membership-role assignments |
| `provider_webhook_events` | 90 days | Audit trail, then archive |
| `export_history` | 7 years | Legal compliance requirement |
| `audit_logs` | 7 years | Legal compliance requirement |

---

## 3. Migration Sequence

> Design only. Do NOT run migrations in this phase.

```
PR-2 Migration Order:
1. Seed roles table (SYSTEM_ADMIN, PERMISSION_ADMIN, FORM_EDITOR, etc.)
2. Seed permissions table (25 permissions)
3. Seed role_permissions (default assignments per RBAC matrix)
4. Create auth_identities table
5. Create agencies.clerk_org_id column
6. Create agency_memberships table
7. Create membership_roles table
8. Create provider_webhook_events table
9. Create export_history table
10. Alter audit_logs (add columns)
11. Sync existing officials to auth_identities
12. Assign default roles to existing officials
```

---

## 4. Privacy Notes

- `ip_address` and `user_agent` in audit_logs may contain PII — handle per GDPR if applicable.
- Consider anonymizing IPs after 90 days.
- `metadata_json` should not store sensitive data.
- Export file paths should not be publicly accessible.

---

## 5. Schema Corrections (What Changed)

### webhook_events FK Removed

**Problem:** The original design had a FK from `webhook_events` to `officials(id)`. This is incorrect because webhook events are provider-scoped, not user-scoped. A webhook event like `user.created` arrives before a local `officials` record exists.

**Fix:** Removed `official_id FK` from `provider_webhook_events`. Processing logic maps `provider_user_id` to `officials` during event handling.

### Table Renamed to `provider_webhook_events`

Renamed from `webhook_events` to `provider_webhook_events` to make the provider-scoped nature explicit.

### `membership_roles` Added

Added a separate `membership_roles` junction table for role assignment. Role is no longer stored directly on `agency_memberships` or `officials`.

### `roles` and `permissions` Catalog Tables Added

Added explicit catalog tables for roles and permissions (instead of treating them as magic strings). This enables the RBAC system to be managed programmatically.

### `officials` Extended with `status` and `last_login_at`

Added explicit status column and last login tracking to the officials table.
