import {isString} from "../types/isType";
import {TypedArray} from "../types/TypedArray";

export type Buffer = TypedArray | ArrayBuffer | DataView;

export const stringBufferToBuffer = function(data: string | Buffer): Buffer {
    if (isString(data)) {
        return new TextEncoder().encode(data);
    }
    return data;
};

export const stringBufferToString = function(data: string | Buffer): string {
    if (isString(data)) {
        return data;
    }
    return new TextDecoder().decode(data);
};

export interface Hash {
    
    hash(data: string): Promise<string>;
    
    hash(data: Buffer): Promise<string>;
    
}
