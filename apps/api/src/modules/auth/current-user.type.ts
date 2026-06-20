export type UserRole = 'ADMIN' | 'OFFICIAL' | 'VIEWER';
export type FormPermission =
  | 'FORM_TEMPLATE_EDIT'
  | 'FORM_TEMPLATE_APPROVE'
  | 'FORM_TEMPLATE_PERMISSION_ADMIN';

export interface PublicUser {
  id: string;
  username: string | null;
  fullName: string;
  positionTitle: string | null;
  rankTitle: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  agencyId: string | null;
  agencyName: string | null;
  agencyCode: string | null;
  isActive: boolean;
  permissions: FormPermission[];
}

export type CurrentUser = PublicUser;
