export interface ProductionModes<T> {
    development: T;
    production: T;
}

export type ProductionMode = keyof ProductionModes<any>;

interface ProductionModesClass {
    readonly all: ReadonlyArray<ProductionMode>;
}

export const ProductionModes: ProductionModesClass = {
    
    all: Object.keys<ProductionModes<null>>({development: null, production: null}),
    
};