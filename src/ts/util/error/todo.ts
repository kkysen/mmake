export function TODO(message?: string): Error {
    return new Error(!message ? "TODO" : `TODO: ${message}`);
}