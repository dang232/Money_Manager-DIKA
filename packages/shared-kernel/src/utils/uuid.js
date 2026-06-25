"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUuid = generateUuid;
exports.isValidUuid = isValidUuid;
// ponytail: uuid helpers backed by Node crypto
const crypto_1 = require("crypto");
// generate a v4 uuid
function generateUuid() {
    return (0, crypto_1.randomUUID)();
}
// validate standard uuid v4 format
function isValidUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
//# sourceMappingURL=uuid.js.map