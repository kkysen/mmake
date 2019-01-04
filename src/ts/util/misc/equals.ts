import {Test} from "../functional/Test";
import {hash} from "./hash";
import {regex} from "./regex";

export namespace equals {
    
    export interface Equals<T> {
        
        (t1: T, t2: T): boolean;
        
    }
    
    const _referential: Equals<any> = Object.is;
    
    export const referential = function <T>(): Equals<T> {
        return _referential;
    };
    
    export const bind = function <T>(equals: Equals<T>, t1: T): (t2: T) => boolean {
        return t2 => equals(t1, t2);
    };
    
    export const by = function <T, U>(keyExtractor: (t: T) => U): Equals<T> {
        return (t1, t2) => keyExtractor(t1) === keyExtractor(t2);
    };
    
    const _default: Equals<any> = function <T>(t1: T, t2: T): boolean {
        return _referential(t1, t2) || by(hash.referential())(t1, t2);
    };
    
    export const default_ = function <T>(): Equals<T> {
        return _default;
    };
    
    const isReferentialEqualitySource = ((): Test<string> => {
        const twoArgs = /\(([^\s,]*)\s*,\s*([^\s)]*)\)/;
        const equality = /\s*\1\s*===\s*\2/;
        const functionBody = regex.join(/\s*{\s*return/, equality, /\s*;\s*}/);
        const func = regex.join(/function\s*/, twoArgs, functionBody);
        const arrow = /\s*=>/;
        const arrowFuncWithBody = regex.join(twoArgs, arrow, functionBody);
        const arrowFunc = regex.join(twoArgs, arrow, equality);
        return s => [arrowFunc, arrowFuncWithBody, func].some(regex => regex.test(s));
    })();
    
    export const fast = function <T>(equals: Equals<T>): Equals<T> {
        // means equals is using referential equality, don't repeat
        // double checking referential equality is cheap except for strings
        const _referential = referential();
        if (equals === _referential || isReferentialEqualitySource(equals.toString())) {
            return _referential;
        }
        return (t1: T, t2: T) => t1 === t2 || equals(t1, t2);
    };
    
}