import {isPromise} from "../types/isType";

export type MaybePromise<T> = T | Promise<T>;

export const forcePromise = function <T>(maybePromise: MaybePromise<T>): Promise<T> {
    if (isPromise(maybePromise)) {
        return maybePromise;
    }
    return Promise.resolve(maybePromise);
};