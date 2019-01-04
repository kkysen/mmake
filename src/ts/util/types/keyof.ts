import {WellKnownSymbolKeyOf} from "./WellKnownSymbols";

export type StringKeyOf<T> = Extract<keyof T, string>;

/**
 * WellKnownSymbols are not included in keyof,
 * a bug in the TypeScript compiler.
 * It should be fixed in TypeScript 3.0.
 */
export type KeyOf<T> = keyof T | WellKnownSymbolKeyOf<T>;