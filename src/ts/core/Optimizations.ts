import {Flag, Flags} from "./Flag";

export interface Optimizations {
    readonly level: number | "s" | "z";
    readonly lto: Flag;
    readonly flags: Flags;
}

export const Optimizations = {
    
    toString({level, lto, flags}: Optimizations): string {
        return Flags.toString([`O${level}`, lto, ...flags]);
    },
    
};