export interface MapFields {
    
    <T, U>(obj: T, mapper: (field: ValueOf<T>) => ValueOf<U>): U;
    
    <T, U>(obj: {[field: string]: T}, mapper: (field: T) => U): {[field: string]: U};
    
}

export const mapFields: MapFields = function <T, U>(
    obj: {[field: string]: T},
    mapper: (field: T) => U,
): {[field: string]: U} {
    const mapped: {[field: string]: U} = {};
    for (const [key, value] of Object.entries(obj)) {
        mapped[key] = mapper(value);
    }
    return mapped;
};