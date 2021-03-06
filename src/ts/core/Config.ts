import {O_RDONLY} from "constants";
import {TsNode} from "../lib/ts-node";
import {FileSystems} from "../util/io/FileSystems";
import {Path} from "../util/io/Path";
import {path} from "../util/io/pathExtensions";
import {Target, Targets, UserTargets} from "./Target";

export interface Config {
    readonly name: string;
    readonly targets: Targets;
}

export interface UserConfig {
    readonly name: string;
    readonly targets: UserTargets;
}

const tsNode = TsNode.create({
    typeCheck: true,
    transpileOnly: false,
});

function resolveRequirePath(requirePath: Path): Path {
    const {
        directory = path.of(""),
        extensionLessFileName: fileName,
        extension: ext,
    } = requirePath;
    if (ext !== ".ts") {
        console.warn(`${requirePath} should be a TypeScript (.ts) file`);
    }
    for (const ext of [".ts", ".js", ""]) {
        const requirePath = directory.resolve(`${fileName}${ext}`);
        tsNode.register();
        let resolved;
        try {
            resolved = require.resolve(requirePath.raw);
        } catch {}
        tsNode.unRegister();
        if (resolved) {
            return path.onFileSystem(FileSystems.current)(resolved);
        }
    }
    throw new Error(`config file "${requirePath}" cannot be found and/or loaded`);
}

export const Config = {
    
    of: ({name, targets}: UserConfig): Config => ({
        name,
        targets: targets.map(target => Target.merge(name, target)),
    }),
    
    async userLoad(requirePath: Path): Promise<UserConfig> {
        const resolvedPath = resolveRequirePath(requirePath);
        const fd = await resolvedPath.call(path.open(O_RDONLY));
        const code = (await fd.readFile()).toString();
        await fd.close();
        const mmakeExports = ["UserConfig", "Promise<UserConfig>"].map(type => `export const mmake: ${type} = `);
        if (!mmakeExports.some(s => code.includes(s))) {
            throw new Error(`config file \`${requirePath}\` must contain ${
                mmakeExports.map(s => `\`${s}\``).join(" or ")
                }`);
        }
        const {mmake} = require(resolvedPath.raw) as {mmake: UserConfig | Promise<UserConfig>};
        return await mmake;
    },
    
    async load(requirePath: Path): Promise<Config> {
        return Config.of(await Config.userLoad(requirePath));
    },
    
};
