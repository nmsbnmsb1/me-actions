export const isError = (e) => Object.prototype.toString.call(e) === '[object Error]' || e instanceof Error;
export const defer = () => {
    const d = {};
    d.p = new Promise((resolve, reject) => {
        d.resolve = resolve;
        d.reject = reject;
    });
    return d;
};
export const ActionStatus = {
    Idle: 0,
    Pending: 1,
    Resolved: 2,
    Rejected: 3,
    Stopped: 4,
};
export const ErrHandler = {
    Ignore: 0,
    RejectImmediately: 1,
    RejectAllDone: 2,
};
//# sourceMappingURL=utils.js.map