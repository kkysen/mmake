export const when = function(bool: boolean): (f: () => void) => void {
    return f => bool && f();
};