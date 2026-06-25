"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserId = void 0;
// ponytail: UserId value object — wraps user identifier, provides DEFAULT for single-user v1
class UserId {
    static DEFAULT = new UserId('00000000-0000-4000-a000-000000000001');
    value;
    constructor(value) {
        if (!value || value.trim().length === 0) {
            throw new Error('UserId cannot be empty');
        }
        this.value = value;
    }
    equals(other) {
        return this.value === other.value;
    }
    toString() {
        return this.value;
    }
}
exports.UserId = UserId;
//# sourceMappingURL=user-id.js.map