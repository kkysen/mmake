export function makeToString<T>(toString: (t: T) => OrFalsy<string>): {
    element: {
        toString(t: T): string;
    },
    array: {
        toString(a: ReadonlyArray<T>): string;
    }
} {
    return {
        element: {
            toString: toString as (t: T) => string,
        },
        array: {
            toString: (a: T[]) => a.mapFilter(toString).join(" "),
        },
    };
}