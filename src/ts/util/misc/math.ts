export const sum = function(a: ReadonlyArray<number>): number {
    let sum = 0;
    for (const n of a) {
        sum += n;
    }
    return sum;
};

export const sumBy = function<T>(a: ReadonlyArray<T>, by: (t: T) => number): number {
    let sum = 0;
    for (const n of a) {
        sum += by(n);
    }
    return sum;
};

export type Numeric = number | {valueOf(): number};

const checkNonEmpty = function <T>(a: ReadonlyArray<T>, name: string): void {
    if (a.length === 0) {
        throw new Error(`${name} does not exist b/c 0 elements in array`);
    }
};

export const min = function <N extends Numeric>(a: ReadonlyArray<N>): N {
    checkNonEmpty(a, "min");
    let min = a[0];
    for (let i = 1; i < a.length; i++) {
        const n = a[i];
        if (n < min) {
            min = n;
        }
    }
    return min;
};

export const max = function <N extends Numeric>(a: ReadonlyArray<N>): N {
    checkNonEmpty(a, "max");
    let max = a[0];
    for (let i = 1; i < a.length; i++) {
        const n = a[i];
        if (n > max) {
            max = n;
        }
    }
    return max;
};

export const range = function <N extends Numeric>(a: ReadonlyArray<N>): [N, N] {
    checkNonEmpty(a, "range");
    let min = a[0];
    let max = min;
    for (let i = 1; i < a.length; i++) {
        const n = a[i];
        if (n < min) {
            min = n;
        } else if (n > max) {
            max = n;
        }
    }
    return [min, max];
};