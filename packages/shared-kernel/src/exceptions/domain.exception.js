"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainException = void 0;
// ponytail: base class for all domain-level errors
class DomainException extends Error {
    code;
    constructor(message, code = 'DOMAIN_ERROR') {
        super(message);
        this.name = 'DomainException';
        this.code = code;
    }
}
exports.DomainException = DomainException;
//# sourceMappingURL=domain.exception.js.map