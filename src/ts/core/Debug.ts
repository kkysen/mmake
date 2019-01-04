import {Flag, Flags} from "./Flag";

export interface Debug {
    readonly flags: Flags;
}

export const Debug = {
    
    toString(debug: Debug): string {
        return Flags.toString(debug.flags);
    },
    
};