import {MaybePromise} from "../maybePromise/MaybePromise";

export const getter = function <T>(t: T): () => T {
    return () => t;
};

export const makeGetter = function <T>(): (t: T) => () => T {
    return getter;
};

export type Function<R = any> = (...args: any[]) => R;

export const cache = function <F extends Function>(getter: F): F {
    return refreshableCache(getter).get;
};

interface Refreshable {
    refresh(): void;
}

export interface RefreshableCache<F extends Function> extends Refreshable {
    
    readonly get: F;
    
    readonly getRefreshed: F;
    
}

export const refreshableCache = function <F extends Function>(getter: F, onRefresh: () => void = () => {
}): RefreshableCache<F> {
    let cache: ReturnType<F> | undefined;
    const get: F = <F> ((...args: any[]) => cache !== undefined ? cache : (cache = getter(...args)));
    const refresh = () => {
        cache = undefined;
        onRefresh();
    };
    return {
        get,
        refresh,
        getRefreshed: <F> ((...args: any[]) => {
            refresh();
            return get(...args);
        }),
    };
};

export interface AsyncCache<T> {
    (): MaybePromise<T>;
}

export interface AsyncCacheGetter<T, Args> {
    (args: Args): MaybePromise<T>;
}

interface AsyncCacher {
    
    <T>(getter: AsyncCache<T>, onRefresh?: () => void): AsyncCache<T>;
    
    <T, Args>(getter: AsyncCacheGetter<T, Args>, onRefresh?: () => void): AsyncCacheGetter<T, Args>;
    
}

export const asyncCache: AsyncCacher = <AsyncCacher> function <T, Args>(
    getter: AsyncCacheGetter<T, Args>,
    onRefresh?: () => void,
): AsyncCacheGetter<T, Args> {
    return refreshableAsyncCache(getter, onRefresh).get;
};

export interface RefreshableAsyncCache<T> extends Refreshable {
    
    getRefreshed(): Promise<T>;
    
    get(): MaybePromise<T>;
    
}

export interface RefreshableAsyncCacheGetter<T, Args> extends Refreshable {
    
    getRefreshed(args: Args): Promise<T>;
    
    get(args: Args): MaybePromise<T>;
    
}

interface RefreshableAsyncCacher {
    
    <T>(getter: AsyncCache<T>, onRefresh?: () => void): RefreshableAsyncCache<T>;
    
    <T, Args>(getter: AsyncCacheGetter<T, Args>, onRefresh?: () => void): RefreshableAsyncCacheGetter<T, Args>;
    
}

export const refreshableAsyncCache: RefreshableAsyncCacher = <RefreshableAsyncCacher>
    function <T, Args>(
        getter: AsyncCacheGetter<T, Args>,
        onRefresh: () => void = () => {
        },
    ): RefreshableAsyncCacheGetter<T, Args> {
        let cache: MaybePromise<T> | undefined;
        const refresh = () => {
            cache = undefined;
            onRefresh();
        };
        const get = (args: Args) => cache !== undefined ? cache : cache = (async () => cache = await getter(args))();
        return {
            get,
            refresh,
            getRefreshed: async args => {
                refresh();
                return await get(args);
            },
        };
    };

export type RefreshableCacheType<Cache> = Cache extends {get: infer F} ? F extends Function ? ReturnType<F> : never : never;