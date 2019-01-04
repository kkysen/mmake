export interface AsyncRefresh<T> {
    refresh: () => Promise<T>;
}

export const AsyncRefresh = {
    
    of<T extends {[key: string]: AsyncRefresh<any>}>(t: T): T & AsyncRefresh<T> {
        return Object.assign(t, {
            refresh: async () => {
                const promises = Object.values(t).mapFilter(e => e.refresh).mapCall();
                await Promise.all(promises);
                return t;
            },
        });
    },
    
};