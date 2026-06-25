"use strict";
// ponytail: shared-kernel barrel — one import for all cross-service primitives
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// value objects
__exportStar(require("./value-objects/money"), exports);
__exportStar(require("./value-objects/user-id"), exports);
__exportStar(require("./value-objects/budget-period"), exports);
__exportStar(require("./value-objects/transaction-type"), exports);
// interfaces / ports
__exportStar(require("./interfaces/event-bus.port"), exports);
__exportStar(require("./interfaces/cache.port"), exports);
__exportStar(require("./interfaces/repository.port"), exports);
// exceptions
__exportStar(require("./exceptions/domain.exception"), exports);
__exportStar(require("./exceptions/not-found.exception"), exports);
// utils
__exportStar(require("./utils/uuid"), exports);
__exportStar(require("./utils/correlation-id"), exports);
//# sourceMappingURL=index.js.map