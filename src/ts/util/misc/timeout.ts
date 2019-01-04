export function sleep(seconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

export interface ForeverPromise {
    readonly promise: Promise<void>;
    readonly cancel: () => void;
}

export function cancellableForever(resolutionSeconds: number): ForeverPromise {
    let cancelled = false;
    const promise = (async () => {
        while (!cancelled) {
            await sleep(resolutionSeconds);
        }
    })();
    return {
        promise,
        cancel: () => cancelled = true,
    };
}

export function forever(): Promise<void> {
    return cancellableForever(1).promise;
}