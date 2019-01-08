import {Path} from "../util/io/Path";
import {path} from "../util/io/pathExtensions";

export interface MMakeArgs {
    readonly configRequirePath: Path;
    readonly args: ReadonlyArray<string>;
}

export const MMakeArgs = {
    
    resolveRequirePath(localRequirePath: string): Path {
        return path.of(localRequirePath).call(path.toAbsolute);
    },
    
    of(args: ReadonlyArray<string>): MMakeArgs {
        const defaultConfigPath = "./mmake.config.ts";
        // const defaultConfigPath = "./MMake.js";
        const [configPathFlag = "", configPath, ...mmakeArgs] = args;
        if (new Set(["-p", "--path"]).has(configPathFlag)) {
            if (!configPath) {
                throw new Error(`path flag supplied but ${defaultConfigPath} path not specified`);
            }
            return {
                configRequirePath: MMakeArgs.resolveRequirePath(configPath),
                args: mmakeArgs,
            };
        }
        return {
            configRequirePath: MMakeArgs.resolveRequirePath(defaultConfigPath),
            args,
        };
    },
    
};