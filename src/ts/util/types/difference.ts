
/**
 * T \ U
 */
export type Difference<T, U> = {[K in Exclude<keyof T, keyof U>]: T[K]};

/**
 * T \ U & Partial<U>
 */
export type PartialDifference<T, U> = Difference<T, U> & Partial<U>;


// const s: symbol = Symbol.iterator;
//
//
// type X = {
//     x: number;
//     y: number;
//     [Symbol.iterator](): Iterator<number>;
//     // [Symbol.toStringTag]: "";
// }
//
// const a: KeyOf<X> = Symbol.match;
//
// type Y = {
//     y: number;
// }
//
// type XY = PartialDifference<Y, X>;
// const xy: XY = {x: 1, [Symbol.iterator]: () => [1][Symbol.iterator]()};
// // const x: X = Object.assign(xy, {y: 1});