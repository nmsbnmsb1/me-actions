"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrHandler = exports.ActionStatus = exports.defer = exports.isError = void 0;
const isError = (e) => Object.prototype.toString.call(e) === '[object Error]' || e instanceof Error;
exports.isError = isError;
const defer = () => {
    const d = {};
    d.p = new Promise((resolve, reject) => {
        d.resolve = resolve;
        d.reject = reject;
    });
    return d;
};
exports.defer = defer;
exports.ActionStatus = {
    Idle: 0,
    Pending: 1,
    Resolved: 2,
    Rejected: 3,
    Stopped: 4,
};
exports.ErrHandler = {
    Ignore: 0,
    RejectImmediately: 1,
    RejectAllDone: 2,
};
//# sourceMappingURL=utils.js.map