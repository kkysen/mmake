export interface Range {
    
    map<T>(map: (i: number) => T): T[];
    
    filter(filter: (i: number) => boolean): number[];
    
    forEach(func: (i: number) => void): void;
    
    fill<T>(t: T): T[];
    
    toArray(): number[];
    
    toInterval(): number[];
    
    has(i: number): boolean;
    
}

export type RangeClass = {
    
    "of"(to: number): Range;
    
    "of"(from: number, to: number): Range;
    
    open(from: number, to: number): Range;
    
    closed(from: number, to: number): Range;
    
    ofDomain(domain: number[]): Range;
    
};

export namespace range {
    
    export function of(to: number): Range;
    export function of(from: number, to: number): Range;
    export function of(from: number, to?: number): Range {
        const _from: number = to === undefined ? 0 : from;
        const _to: number = to === undefined ? from : to;
        
        return {
            
            fill<T>(t: T): T[] {
                return [...new Array(_to - _from)].fill(t);
            },
            
            toArray(): number[] {
                return [...new Array(_to - _from)].map((e, i) => i + _from);
            },
            
            map<T>(map: (i: number) => T): T[] {
                return this.toArray().map(map);
            },
            
            filter(func: (i: number) => boolean): number[] {
                return this.toArray().filter(func);
            },
            
            forEach(func: (i: number) => void): void {
                for (let i: number = _from; i < _to; i++) {
                    func(i);
                }
            },
            
            toInterval(): number[] {
                return [_from, _to];
            },
            
            has(i: number) {
                return i >= _from && i < _to;
            },
            
        };
    }
    
    export function open(from: number, to: number): Range {
        return of(from + 1, to);
    }
    
    export function closed(from: number, to: number): Range {
        return of(from, to + 1);
    }
    
    export function ofDomain(domain: number[]): Range {
        return of(Math.min(...domain), Math.max(...domain));
    }
    
}