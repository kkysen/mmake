export interface ProductionModes<T> {
    development: T;
    production: T;
}

export type ProductionMode = keyof ProductionModes<any>;

export namespace ProductionModes {
    
    export const all = Object.keys<ProductionModes<null>>({development: null, production: null});
    
    export function share<T>(t: T): ProductionModes<T> {
        return {
            development: t,
            production: t,
        };
    }
    
    interface StartingWith {
        
        readonly prefix: string;
        
        get(): Set<ProductionMode>;
        
        check(): void;
        
        checked(): Set<ProductionMode>;
        
    }
    
    export function startingWith(prefix: string): StartingWith {
        const modes = !prefix ? all : all.filter(mode => mode.startsWith(prefix));
        const get = () => new Set(modes);
        const check = () => {
            if (modes.length === 0) {
                throw new Error(`"${prefix}" does not match any production modes: [${all.join(", ")}]`);
            }
        };
        return {
            prefix,
            get,
            check,
            checked: () => (check(), get()),
        };
    }
    
}