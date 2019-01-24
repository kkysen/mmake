import {ChildProcess} from "child_process";
import * as readline from "readline";

export interface OutputStreams<T> {
    readonly stdout: T;
    readonly stderr: T;
}

export type OutputStreamName = keyof OutputStreams<any>;

export async function forEachLine(child: ChildProcess,
                                  funcs: Partial<OutputStreams<(line: string, i: number) => void>>): Promise<void> {
    const {stdout, stderr} = child;
    const out = {stdout, stderr};
    (Object.keys(funcs) as OutputStreamName[])
        .forEach(streamName => {
            const func = funcs[streamName]!!;
            const lines = readline.createInterface({
                input: out[streamName],
                terminal: true,
            });
            let lineNum = 0;
            lines.on("line", line => func(line, lineNum++));
        });
    await new Promise<void>((resolve, reject) => {
        child.on("exit", resolve);
        child.on("error", reject);
    });
}

// TODO
// type AsyncNext<T> = () => Promise<IteratorResult<T>>;
//
// function asIterable<T>(next: AsyncNext<T>): AsyncIterable<T> {
//     return {
//         [Symbol.asyncIterator]: () => ({next}),
//     };
// }
//
// function inputToOutputIterable<T>(inputIterable: (func: (t: T) => void) => Promise<void>): AsyncIterable<T> {
//     // using stack as a queue, which is inefficient, but buffering array copies so not as inefficient
//     const bufferLength = 128;
//     type Resolve = {
//         promise: Promise<IteratorResult<T>>;
//         resolve(result: IteratorResult<T>): void;
//     }
//     const queue: Resolve[] = [];
//     let start = 0;
//     const finish = inputIterable(line => {
//
//     });
//     (async () => {
//         await finish;
//         queue.push()
//     })();
//     return asIterable(() => {
//
//     });
// }
//
// function streamAsLines(child: ChildProcess, streamName: OutputStreamName): AsyncNext<string> {
//     // using stack as a queue, which is inefficient, but buffering array copies so not as inefficient
//     const bufferLength = 128;
//     type Resolve = {
//         promise: Promise<IteratorResult<string>>;
//
//     }
//     const queue = [];
//     let start = 0;
//     const finish = forEachLine(child, {
//         [streamName]: (line: string) => {
//             for (let i = start; i < queue.length; i++) {
//
//             }
//         },
//     });
//     (async () => {
//         await finish;
//         queue.push()
//     })();
//     return () => {
//
//     };
// }
//
// export function asLines(child: ChildProcess): OutputStreams<AsyncIterable<string>> {
//     return ({stdout: "stdout", stderr: "stderr"} as object & OutputStreams<OutputStreamName>)
//         .mapFields((streamName: OutputStreamName) => asIterable(streamAsLines(child, streamName)));
// }