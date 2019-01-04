export type Identity<T> = (t: T) => T;

export const identity = <T>(t: T) => t;