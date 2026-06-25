"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundException = void 0;
// ponytail: thrown when an aggregate or entity cannot be located
const domain_exception_1 = require("./domain.exception");
class NotFoundException extends domain_exception_1.DomainException {
    constructor(entity, id) {
        super(`${entity} with id ${id} not found`, 'NOT_FOUND');
        this.name = 'NotFoundException';
    }
}
exports.NotFoundException = NotFoundException;
//# sourceMappingURL=not-found.exception.js.map