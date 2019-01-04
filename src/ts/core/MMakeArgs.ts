import * as path from "path";

export interface MMakeArgs {
    readonly configRequirePath: string;
    readonly args: ReadonlyArray<string>;
}

export const MMakeArgs = {
    
    resolveRequirePath(localRequirePath: string): string {
        return path.join(process.cwd(), localRequirePath);
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