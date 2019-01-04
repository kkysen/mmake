import {capitalize} from "../misc/utils";
import {isBrowser} from "../window/anyWindow";

export interface NativeTypes {
    
    null: null;
    undefined: undefined;
    boolean: boolean;
    number: number;
    string: string;
    Function: Function;
    Array: Array<any>;
    RegExp: RegExp;
    Date: Date;
    object: object;
    
}

export type Is<T> = (o: any) => o is T;

export function isSingleton<T>(singleton: T): Is<T> {
    return (o: any): o is T => o === singleton;
}

export function isByConstructor<T>(constructor: new (...args: any[]) => T): Is<T> {
    return (o: any): o is T => o.constructor === constructor;
}

export const isNativeType = function <T extends keyof NativeTypes>(type: T): Is<NativeTypes[T]> {
    const typeName: string = `[object ${capitalize(type)}]`;
    const toString = Object.prototype.toString;
    return (o: any): o is NativeTypes[T] => toString.call(o) === typeName;
};

// can use isNativeType for all, but some can be optimized
export const isNull = isSingleton(null);
export const isUndefined = isSingleton(undefined);
export const isBoolean: Is<boolean> = (o: any): o is boolean => o === true || o === false;
export const isNumber = isNativeType("number");
export const isString = isNativeType("string");
export const isFunction: Is<Function> = (o: any): o is Function => typeof o === "function";
export const isArray = Array.isArray;
export const isReadonlyArray: Is<ReadonlyArray<any>> = Array.isArray;
export const isRegExp = isNativeType("RegExp");
export const isDate = isNativeType("Date");
export const isObject = isNativeType("object");

export const _isTruthy = <T>(o: OrFalsy<T>): o is T => !!o;
export const isTruthy = <T>(): Is<T> => _isTruthy as Is<T>;

export const isDataView = isByConstructor(DataView);
export const isArrayBuffer = isByConstructor(ArrayBuffer);

export const isPromise = isByConstructor(Promise);

export function isIterable<T>(o: any): o is Iterable<T> {
    return o[Symbol.iterator];
}

export function isAsyncIterable<T>(o: any): o is AsyncIterable<T> {
    return o[Symbol.asyncIterator];
}

export const isWindow= isSingleton(isBrowser ? window : {} as Window);