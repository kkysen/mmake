export namespace cmp {
    
    export const byNumber = function <T>(keyExtractor: (t: T) => number): (t1: T, t2: T) => number {
        return (t1, t2) => keyExtractor(t1) - keyExtractor(t2);
    };
    
    export const byNumeric = function <T>(keyExtractor: (t: T) => {valueOf(): number}): (t1: T, t2: T) => number {
        return byNumber(keyExtractor.then_(e => e.valueOf()));
    };
    
    export const byString = function <T>(keyExtractor: (t: T) => string): (t1: T, t2: T) => number {
        return (t1, t2) => {
            const k1 = keyExtractor(t1);
            const k2 = keyExtractor(t2);
            return k1 === k2 ? 0 : k1 < k2 ? -1 : 1;
        };
    };
    
}