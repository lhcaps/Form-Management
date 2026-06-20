import { ApplicationError } from '../../../common/application-error';

export class FormStudioError extends ApplicationError {
  constructor(code: string, message: string, status = 400, details?: unknown) {
    super(code, message, status, details);
  }
}
