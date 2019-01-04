import {Flags} from "./Flag";

export interface Macros {
    readonly [macro: string]: string;
}

export const Macros = {
    
    toString(macros: Macros): string {
        return Flags.toString(Object.entries(macros)
            .map(([name, value]) => `D${name}=${value}`));
    },
    
};