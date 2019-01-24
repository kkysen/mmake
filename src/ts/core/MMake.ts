import * as child_process from "child_process";
import {range} from "../util/collections/Range";
import {Path} from "../util/io/Path";
import {path} from "../util/io/pathExtensions";
import {tab} from "../util/misc/utils";
import {forEachLine} from "../util/stream/lines";
import {Config} from "./Config";
import {MMakeArgs} from "./MMakeArgs";
import {ProductionMode, ProductionModes} from "./ProductionModes";
import {Target, TargetRule, Targets} from "./Target";

export interface MMakeTarget {
    
    readonly targets: Targets;
    
    modes(modes: Set<ProductionMode>): MMakeTargetMode;
    
}

export interface MMakeTargetMode {
    
    readonly targets: Targets;
    
    readonly modes: ReadonlyArray<ProductionMode>;
    
    make(): Promise<void>;
    
    run(args: ReadonlyArray<string>): Promise<void>;
    
}

namespace MMakeTarget {
    
    function log(generated: Path) {
        console.log(`${tab}${tab}${generated}`);
    }
    
    function addTabs(numTabs: number, out: (line: string) => void): (line: string) => void {
        const tabs = range.of(numTabs).fill(tab).join("");
        return line => out(`${tabs}${line}`);
    }
    
    export function of(targets: Targets): MMakeTarget {
        return {
            targets,
            modes(modeSet: Set<ProductionMode>): MMakeTargetMode {
                const modes = [...modeSet];
    
                async function make(): Promise<void> {
                    console.log(`${tab}generating Makefiles...`);
                    await modes.flatMap(mode => targets.map(target => target.mode(mode)))
                        .asyncMap(generator => generator.createMakeFile(log));
                }
    
                async function run(args: ReadonlyArray<string>): Promise<void> {
                    await make();
                    const spawners = targets
                        .map(e => e.rule.directories)
                        .flatMap(directories => modes.map(mode => directories[mode]))
                        .map(dir => async () => {
                            // The paths in the Makefiles are all relative to the cwd,
                            // so they can't be run from those directories.
                            // Instead, I'm copying them over to a local temp file
                            // and then running make on that Makefile.
                            const temp = await path.of("Makefile.tmp.").call(path.temp());
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
                            await forEachLine(child, {
                                stdout: addTabs(2, console.log),
                                // stderr: addTabs(2, console.error),
                                // can pipe stderr, too, but then I lose terminal coloring for some reason
                            });
                            await temp.call(path.remove.file);
                        });
                    // run sequentially, parallelism is passed to make itself
                    for (const spawn of spawners) {
                        await spawn();
                    }
                }
                
                return {
                    targets,
                    modes,
                    make,
                    run,
                };
            },
        };
    }
    
}

export interface MMake {
    
    readonly config: Config;
    
    target(name: string): MMakeTarget;
    
    all(): MMakeTarget;
    
    run(args: MMakeArgs): Promise<void>;
    
}

export namespace MMake {
    
    export function of(config: Config): MMake {
        function getTarget(name: string): Targets {
            const target = config.targets.find(target => target.rule.target === name);
            if (!target) {
                throw new Error(`target "${name}" does not exist`);
            }
            return [target];
        }
    
        const getAllTargets = () => config.targets;
    
        async function run({run, targetName, modePrefix, makeArgs}: MMakeArgs): Promise<void> {
            const targets = targetName ? getTarget(targetName) : getAllTargets();
            const modes = ProductionModes.startingWith(modePrefix).checked();
            const target = MMakeTarget.of(targets).modes(modes);
            if (run) {
                await target.run(makeArgs);
            } else {
                await target.make();
            }
        }
        
        return {
            config,
            target: getTarget.then_(MMakeTarget.of),
            all: () => MMakeTarget.of(getAllTargets()),
            run,
        };
    }
    
    export async function run(args: MMakeArgs): Promise<void> {
        const config = await Config.load(args.configRequirePath);
        const mmake = of(config);
        await mmake.run(args);
    }
    
}
