import {Path} from "../util/io/Path";
import {path} from "../util/io/pathExtensions";

export interface MMakeArgs {
    
    readonly configRequirePath: Path;
    readonly run: boolean;
    readonly targetName: string | undefined;
    readonly modePrefix: string;
    readonly makeArgs: ReadonlyArray<string>;
    
}

export namespace MMakeArgs {
    
    function resolveRequirePath(localRequirePath: string): Path {
        return path.of(localRequirePath).call(path.toAbsolute);
    }
    
    export function of(args: ReadonlyArray<string>): MMakeArgs {
        const {configRequirePath, mmakeArgs} = (() => {
            const defaultConfigPath = "./mmake.config.ts";
            // const defaultConfigPath = "./MMake.js";
            const [configPathFlag = "", configPath, ...mmakeArgs] = args;
            if (new Set(["-p", "--path"]).has(configPathFlag)) {
                if (!configPath) {
                    throw new Error(`path flag supplied but ${defaultConfigPath} path not specified`);
                }
                return {
                    configRequirePath: resolveRequirePath(configPath),
                    mmakeArgs,
                };
            }
            return {
                configRequirePath: resolveRequirePath(defaultConfigPath),
                mmakeArgs: args,
            };
        })();
        const [targetArg = "", ...makeArgs] = args;
        const [_, dontRun, targetName, modePrefix] = /(-?)([^:]*):?(.*)/.exec(targetArg)!!;
        return {
            configRequirePath,
            targetName,
            run: targetArg ? !dontRun : false,
            modePrefix,
            makeArgs,
        };
    }
    
}