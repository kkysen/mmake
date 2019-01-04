import {identity} from "../functional/utils";
import {fnv1a} from "../hash/fnv1a";
import {isNumber, isString} from "../types/isType";

export namespace hash {
    
    export type HashValue = number | string;
    
    export interface Hash<T, H = HashValue> {
        
        (t: T): H;
        
    }
    
    export const referential = function <T>(): Hash<T, T> {
        return identity;
    };
    
    export const default_ = function <T, H = string>(): Hash<T, H> {
        return JSON.stringify as Hash<any, any>;
    };
    
    export const makeNumber = function <H>(hash: H): number {
        return isNumber(hash) ? hash : fnv1a(isString(hash) ? hash : default_()(hash));
    };
    
}