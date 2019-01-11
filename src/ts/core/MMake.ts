import * as child_process from "child_process";
import * as readline from "readline";
import {path} from "../util/io/pathExtensions";
import {Config} from "./Config";
import {MMakeArgs} from "./MMakeArgs";
import {ProductionMode, ProductionModes} from "./ProductionModes";
import {Target, Targets} from "./Target";

export interface MMakeTarget {
    
    make(): Promise<void>;
    
    run(modes: Set<ProductionMode>, args: ReadonlyArray<string>): Promise<void>;
    
}

const tab = "    ";

const MMakeTarget = {
    
    of(targets: Targets): MMakeTarget {
        async function make(): Promise<void> {
            console.log(`${tab}generating Makefiles...`);
            await targets.map(target =>
                Target.makeFileGenerator(target, generated => console.log(`${tab}${tab}${generated}`))
            ).asyncMap(f => f());
        }
        
        async function run(modeSet: Set<ProductionMode>, args: ReadonlyArray<string>): Promise<void> {
            await make();
            const modes = [...modeSet];
            const spawners = targets
                .map(e => e.directories)
                .flatMap(directories => modes.map(mode => directories[mode]))
                .map(dir => async () => {
                    // The paths in the Makefiles are all relative to the cwd,
                    // so they can't be run from those directories.
                    // Instead, I'm copying them over to a local temp file
                    // and then running make on that Makefile.
                    const temp = await path.of("Makefile.").call(path.temp());
                    const makeArgs = [
                        `--makefile=${temp}`,
                        `--include-dir=${dir}`,
                        ...args,
                    ];
                    console.log(`${tab}\`make ${makeArgs.join(" ")}\``);
                    await dir.resolve("Makefile").call(path.copy.to(temp));
                    return {
                        temp,
                        child: child_process.spawn("make", makeArgs, {
                            stdio: ["inherit", "pipe", "inherit"],
                            windowsHide: true,
                        }),
                    };
                })
                .map(spawn => async () => {
                    const {temp, child} = await spawn();
                    const out = {
                        stdout: console.log,
                        stderr: console.error,
                    };
                    // can pipe stderr, too, but then I lose terminal coloring for some reason
                    const streamNames: (keyof typeof out)[] = ["stdout"];
                    streamNames.forEach(streamName => {
                        const lines = readline.createInterface({
                            input: child[streamName],
                            terminal: true,
                        });
                        lines.on("line", line => out[streamName](`${tab}${tab}${line}`));
                    });
                    await new Promise<void>((resolve, reject) => {
                        child.on("exit", resolve);
                        child.on("error", reject);
                    });
                    await temp.call(path.remove.file);
                });
            // run sequentially, parallelism is passed to make itself
            for (const spawn of spawners) {
                await spawn();
            }
        }
        
        return {make, run};
    },
    
};

export interface MMake {
    
    readonly config: Config;
    
    target(name: string): MMakeTarget;
    
    all(): MMakeTarget;
    
    run(args: ReadonlyArray<string>): Promise<void>;
    
}

export const MMake = {
    
    new(config: Config): MMake {
        function getTarget(name: string): MMakeTarget {
            const target = config.targets.find(target => target.target === name);
            if (!target) {
                throw new Error(`target "${name}" does not exist`);
            }
            return MMakeTarget.of([target]);
        }
        
        function getAllTargets(): MMakeTarget {
            return MMakeTarget.of(config.targets);
        }
        
        async function run(args: ReadonlyArray<string>): Promise<void> {
            const [targetArg = "", ...makeArgs] = args;
            const [_, targetName, run, modeArg] = /([^:]*)(:?)(.*)/.exec(targetArg)!!;
            const target = targetName ? getTarget(targetName) : getAllTargets();
            if (run) {
                const all = ProductionModes.all;
                const modes = !modeArg ? all : all.filter(mode => mode.startsWith(modeArg));
                if (modes.length === 0) {
                    throw new Error(`"${modeArg}" does not match any production modes: [${all.join(", ")}]`);
                }
                await target.run(new Set(modes), makeArgs);
            } else {
                await target.make();
            }
        }
        
        return {
            config,
            target: getTarget,
            all: getAllTargets,
            run,
        };
    },
    
    async run(args: MMakeArgs): Promise<void> {
        const config = await Config.load(args.configRequirePath);
        const mmake = MMake.new(config);
        await mmake.run(args.args);
    },
    
};