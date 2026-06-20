import { SetMetadata } from '@nestjs/common';
import type { FormPermission } from './current-user.type';

export const FORM_PERMISSIONS_KEY = 'qllaw:form-permissions';

export const RequireFormPermissions = (...permissions: FormPermission[]) =>
  SetMetadata(FORM_PERMISSIONS_KEY, permissions);
