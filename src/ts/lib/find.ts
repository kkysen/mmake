import * as child_process from "child_process";
import {Path} from "../util/io/Path";
import {forEachLine} from "../util/stream/lines";

const cache = new Map<string, Promise<string[]>>();

export function findFiles(directory: Path, args: ReadonlyArray<string>): Promise<string[]> {
    const findArgs = [directory.raw, ...args];
    const findArgsString = findArgs.join(" ");
    const cached = cache.get(findArgsString);
    if (cached) {
        return cached;
    }
    // console.log(`find ${findArgsString}`);
    const child = child_process.spawn("find", findArgs, {
        stdio: ["inherit", "pipe", "inherit"],
        windowsHide: true,
    });
    const promise = (async () => {
        const lines: string[] = [];
        await forEachLine(child, {stdout: line => lines.push(line)});
        return lines;
    })();
    cache.set(findArgsString, promise);
    return promise;
}