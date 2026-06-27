// ponytail: base class for all domain-level errors
import { ErrorDef } from './error-codes';

export class DomainException extends Error {
  readonly code: string;

  constructor(message: string, code = 'DOMAIN_ERROR') {
    super(message);
    this.name = 'DomainException';
    this.code = code;
  }

  static fromError(err: ErrorDef): DomainException {
    return new DomainException(err.message, err.code);
  }
}