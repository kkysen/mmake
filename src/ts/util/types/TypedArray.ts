export type TypedArray =
    Int8Array
    | Uint8Array
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Uint8ClampedArray
    | Float32Array
    | Float64Array
    | BigInt64Array
    | BigUint64Array
    ;

export type AllTypedArray = Int8Array
    & Uint8Array
    & Int16Array
    & Uint16Array
    & Int32Array
    & Uint32Array
    & Uint8ClampedArray
    & Float32Array
    & Float64Array
    & BigInt64Array
    & BigUint64Array
    ;

const isArrayBuffer = function(typedArray: TypedArray | DataView | ArrayBuffer): typedArray is ArrayBuffer {
    return !(typedArray as TypedArray | DataView).buffer;
};

export const noCopyBuffer = function(typedArray: TypedArray | DataView | ArrayBuffer): Buffer {
    if (isArrayBuffer(typedArray)) {
        return Buffer.from(typedArray);
    }
    const arrayBuffer: ArrayBuffer = typedArray.buffer as ArrayBuffer;
    let buffer = Buffer.from(arrayBuffer);
    if (typedArray.byteLength !== arrayBuffer.byteLength) {
        return buffer.slice(typedArray.byteOffset, typedArray.byteOffset + typedArray.byteLength);
    }
    return buffer;
};