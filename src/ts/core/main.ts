import {addExtensions} from "../util/extensions/allExtensions";
import {MMake} from "./MMake";
import {MMakeArgs} from "./MMakeArgs";

export async function run(args: ReadonlyArray<string>): Promise<void> {
    console.log(args.join(" "));
    await MMake.run(MMakeArgs.of(args));
}

export function main(): void {
    addExtensions();
    (async () => {
        try {
            const [nodePath, mainPath, ...args] = process.argv;
            await run(args);
        } catch (e) {
            console.error(e);
        }
    })();
}

main();