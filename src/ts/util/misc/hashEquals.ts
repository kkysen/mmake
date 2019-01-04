import {equals} from "./equals";
import {hash} from "./hash";

export namespace hashEquals {
    
    import Equals = equals.Equals;
    import Hash = hash.Hash;
    import HashValue = hash.HashValue;
    
    export interface HashEquals<T, H = HashValue> {
        
        readonly hash: Hash<T, H>;
        readonly equals: Equals<T>;
        
    }
    
    export interface HashEqualable<T, H = HashValue> {
        
        equals(this: T, other: T): boolean;
        
        hash(): H;
        
    }
    
    const _referential: HashEquals<any, any> = {
        hash: hash.referential(),
        equals: equals.referential(),
    };
    
    export const referential = function <T>(): HashEquals<T, T> {
        return _referential;
    };
    
    export const isReferential = function <T, H>(hashEquals: HashEquals<T, H>): boolean {
        return hashEquals === _referential;
    };
    
    const _default: HashEquals<any, any> = {
        hash: hash.default_(),
        equals: equals.default_(),
    };
    
    export const default_ = function <T, H>(): HashEquals<T, H> {
        return _default;
    };
    
    export const fastEquals = function <T, H>(hashEquals: HashEquals<T, H>): HashEquals<T, H> {
        return {
            hash: hashEquals.hash,
            equals: equals.fast(hashEquals.equals),
        };
    };
    
    export const fromHash = function <T, H>(hash: Hash<T, H>): HashEquals<T, H> {
        return {
            hash,
            equals: equals.by(hash),
        };
    };
    
}