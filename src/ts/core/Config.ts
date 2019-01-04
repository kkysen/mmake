import * as fs from "fs-extra";
import * as path from "path";
import {Target, Targets, UserTargets} from "./Target";

export interface Config {
    readonly name: string;
    readonly targets: Targets;
}

export interface UserConfig {
    readonly name: string;
    readonly targets: UserTargets;
}

function resolveRequirePath(requirePath: string): string {
    const {dir, name, ext} = path.parse(requirePath);
    if (ext !== ".ts") {
        console.warn(`${requirePath} should be a TypeScript (.ts) file`);
    }
    for (const ext of [".ts", ".js", ""].reverse()) {
        const requirePath = `${dir}${dir ? "/" : ""}${name}${ext}`;
        try {
            return require.resolve(requirePath);
        } catch {}
    }
    throw new Error(`config file "${requirePath}" cannot be found`);
}

export const Config = {
    
    of: ({name, targets}: UserConfig): Config => ({
        name,
        targets: targets.map(target => Target.merge(name, target)),
    }),
    
    async userLoad(requirePath: string): Promise<UserConfig> {
        const resolvedPath = resolveRequirePath(requirePath);
        const code = (await fs.readFile(resolvedPath)).toString();
        // TODO use TypeScript compiler API instead
        // if (!code.search(/export mmake: UserConfig = /)) {
        //     throw new Error(`${requirePath} must export "const mmake: UserConfig"`);
        // }
        const {mmake} = require(resolvedPath) as {mmake: UserConfig};
        return mmake;
    },
    
    async load(requirePath: string): Promise<Config> {
        return Config.of(await Config.userLoad(requirePath));
    },
    
};
