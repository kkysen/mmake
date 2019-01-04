import {when} from "../misc/when";

export const isBrowser = typeof window !== "undefined";

export const inBrowser = when(isBrowser);

export const anyWindow: any = isBrowser ? window : global;

export const globals = function(o: object): void {
    Object.assign(anyWindow, o);
};

export const globalProperties = function(o: object): void {
    Object.assignProperties(anyWindow, o);
};

globals({globals, globalProperties});