import {O_CREAT, O_TRUNC, O_WRONLY} from "constants";
import {findFiles} from "../lib/find";
import {Path} from "../util/io/Path";
import {path} from "../util/io/pathExtensions";
import {Compiler, compilers} from "./Compiler";
import {Debug} from "./Debug";
import {Directories} from "./Directories";
import {Flag, Flags} from "./Flag";
import {Language, Languages} from "./Languages";
import {Libraries, Library, LibraryBinaries, LibraryBinary, LibraryIncludes} from "./Library";
import {Macros} from "./Macros";
import {MakeRule} from "./MakeRule";
import {Optimizations} from "./Optimizations";
import {ProductionMode, ProductionModes} from "./ProductionModes";
import {SuppressErrors} from "./SuppressError";
import {Tools} from "./Tools";
import {Warnings} from "./Warning";

export interface TargetRule {
    readonly name: string;
    readonly target: string;
    readonly compiler: Compiler;
    readonly standards: Languages;
    readonly tools: Tools;
    readonly warnings: Warnings;
    readonly suppressErrors: SuppressErrors;
    readonly macros: ProductionModes<Macros>;
    readonly libraries: Libraries;
    readonly optimizations: ProductionModes<Optimizations>;
    readonly debug: ProductionModes<Debug>;
    readonly flags: ProductionModes<Flags>;
    readonly directories: Directories;
    readonly filter: (path: Path) => boolean;
}

export interface UserTarget {
    readonly target: string;
    readonly compiler?: Compiler;
    readonly standards?: Partial<Languages>;
    readonly tools?: Partial<Tools>;
    readonly warnings?: Warnings;
    readonly suppressErrors?: SuppressErrors;
    readonly macros?: ProductionModes<Macros>;
    readonly libraries?: Libraries;
    readonly optimizations?: ProductionModes<Partial<Optimizations>>;
    readonly debug?: ProductionModes<Debug>;
    readonly flags?: ProductionModes<Flags>;
    readonly filter?: (path: Path) => boolean;
}

export type UserTargets = ReadonlyArray<UserTarget>;

export interface Target {
    
    readonly rule: TargetRule;
    
    mode(mode: ProductionMode): TargetMode;
    
}

export type Targets = ReadonlyArray<Target>;

export interface TargetMode {
    
    readonly rule: TargetRule;
    
    readonly mode: ProductionMode;
    
    toMakeFile(): Promise<string>;
    
    createMakeFile(log?: (generated: Path) => void): Promise<void>;
    
}

namespace TargetMode {
    
    export function of(rule: TargetRule, mode: ProductionMode): TargetMode {
        const target = rule;
    
        async function toMakeFile(): Promise<string> {
            const {name, compiler, standards, tools, directories, filter} = target;
            const {compilers, preprocessor} = compiler;
        
            const out = (() => {
                const dir = directories[mode];
                return {
                    dir,
                    lib: dir.resolve(`lib${name}.a`),
                    test: dir.resolve(`${name}.test.out`),
                    exe: dir.resolve(`${name}.out`),
                };
            })();
        
            const files = await (async () => {
                const {src, [mode]: out, test} = directories;
                const allFiles = await findFiles(src, []);
            
                function addExtension(extension: string): (path: Path) => Path {
                    return ({raw}) => path.of(`${out}${raw.slice(src.raw.length)}.${extension}`);
                }
            
                const [toObject, toDependency] = ["o", "d"].map(addExtension);
                const isTest = path.startsWith(test);
            
                const sources = allFiles
                    .map(path.of)
                    .filter(e => {
                        const {extension} = e;
                        return extension && extension.slice(1) in compilers;
                    })
                    .filter(filter);
            
                const objects = sources.map(toObject);
                const testSources = sources.filter(isTest);
                const testObjects = testSources.map(toObject);
            
                const testObjectsSet = new Set(testObjects.map(e => e.raw));
                const libObjects = objects.filter(e => !testObjectsSet.has(e.raw));
                const dependencies = sources.map(toDependency);
            
                return {sources, objects, testSources, testObjects, libObjects, dependencies};
            })();
            type Files = typeof files;
            type FileStrings = { [P in keyof Files]: string };
            const fileStrings = files.mapFields(a => a.map(e => e.raw).join(" ")) as FileStrings;
        
            const flags = (() => {
                const flags = (() => {
                    const {warnings, suppressErrors, macros, libraries, debug, optimizations, flags} = target;
                    return {
                        warnings: Warnings.toString(warnings),
                        suppressErrors: SuppressErrors.toString(suppressErrors),
                        macros: Macros.toString(macros[mode]),
                        include: LibraryIncludes.toString(libraries),
                        loadLibraries: LibraryBinaries.toString(libraries),
                        debug: Debug.toString(debug[mode]),
                        lto: Flag.toString(optimizations[mode].lto),
                        optimizations: Optimizations.toString(optimizations[mode]),
                        compiler: Flags.toString(flags[mode]),
                    };
                })();
                const join = (a: string[]): string => a.filter(Boolean).join(" ");
                const {warnings, suppressErrors, macros, include, debug, lto, optimizations, compiler} = flags;
                const common = join([debug, warnings, suppressErrors, optimizations, macros, include, compiler]);
                return {
                    ...flags,
                    preprocessor: join([include, macros, Flags.toString(["MMD", "MP"])]),
                    ...standards.mapFields<Languages, Languages>(version => `-std=${version} ${common}`),
                    link: join([debug, lto]),
                };
            })();
        
            const objectRule = (language: Language): MakeRule => ({
                target: `${out.dir.resolve(`%.${language}.o`)}`,
                dependencies: `${directories.src.resolve(`%.${language}`)}`,
                commands: [
                    `${tools.mkdir} $(dir $@)`,
                    `${preprocessor[language]} ${flags.preprocessor} $< -MF $(@:.o=.d) -MT $@ > /dev/null`,
                    `${compilers[language]} ${flags[language]} -c $< -o $@`,
                ],
                phony: false,
            });
        
            const executeRule = (target: string, executable: Path): MakeRule => ({
                target,
                dependencies: executable,
                commands: [
                    `./${executable}`,
                ],
                phony: true,
            });
        
            const toolRule = (tool: keyof Tools): MakeRule => ({
                target: tool,
                dependencies: out.exe,
                commands: [
                    `${tools[tool]} ./${out.exe}`,
                ],
                phony: true,
            });
        
            const ownLibrary: Library = {
                include: ".",
                binary: out.lib,
            };
        
            const rules: MakeRule[] = [
                {
                    target: "all",
                    dependencies: [out.lib, out.test, out.exe].join(" "),
                    commands: [],
                    phony: true,
                },
                objectRule("c"),
                objectRule("cpp"),
                {
                    target: out.lib,
                    dependencies: `${fileStrings.libObjects}`,
                    commands: [
                        `${compiler.ar} rc ${out.lib} $^`,
                        `${compiler.ranlib} ${out.lib}`,
                    ],
                    phony: false,
                },
                {
                    target: out.test,
                    dependencies: `${out.lib} ${fileStrings.testObjects}`,
                    commands: [
                        `${compilers.cpp} ${flags.link} ${fileStrings.objects} -o $@ ${flags.loadLibraries} ${LibraryBinary.toString(ownLibrary)} ${flags.compiler}`,
                    ],
                    phony: false,
                },
                {
                    target: out.exe,
                    dependencies: `${fileStrings.objects}`,
                    commands: [
                        `${compilers.cpp} ${flags.link} ${fileStrings.objects} -o $@ ${flags.loadLibraries} ${flags.compiler}`,
                    ],
                    phony: false,
                },
                {
                    target: "lib",
                    dependencies: out.lib,
                    commands: [],
                    phony: true,
                },
                {
                    target: "main",
                    dependencies: out.exe,
                    commands: [],
                    phony: true,
                },
                executeRule("test", out.test),
                executeRule("run", out.exe),
                {
                    target: "time",
                    dependencies: out.exe,
                    commands: [
                        `time ./${out.exe}`,
                    ],
                    phony: true,
                },
                toolRule("valgrind"),
                toolRule("callgrind"),
                toolRule("massif"),
                {
                    target: "clean",
                    dependencies: "",
                    commands: [
                        `${tools.rm} -r ${out.dir}`,
                    ],
                    phony: true,
                },
            ];
            return [
                ...rules.map(MakeRule.toString),
                `-include ${fileStrings.dependencies}`,
                "",
            ].join("\n\n");
        }
    
        async function createMakeFile(log: (generated: Path) => void = () => {}): Promise<void> {
            const dir = target.directories[mode];
            const file = dir.resolve("Makefile");
            await dir.call(path.create.directory({recursive: true}));
            const fd = await file.call(path.open(O_WRONLY | O_CREAT | O_TRUNC));
            await fd.writeFile(await toMakeFile());
            await fd.close();
            log(file);
        }
    
        return {
            rule,
            mode,
            toMakeFile,
            createMakeFile,
        };
    }
    
}

export namespace Target {
    
    export const defaultRule: TargetRule = {
        name: "a",
        target: "native",
        compiler: compilers.gcc,
        standards: {
            c: "c11",
            cpp: "c++17",
        },
        tools: {
            valgrind: "valgrind --tool=memcheck --leak-check=full --show-leak-kinds=all",
            callgrind: "valgrind --tool=callgrind",
            massif: "valgrind --tool=massif",
        
            mkdir: "mkdir -p",
            rm: "rm",
            find: "find",
        },
        warnings: ["all", "error", "extra"],
        suppressErrors: [],
        macros: ProductionModes.share({
            _POSIX_C_SOURCE: "201901L",
            _XOPEN_SOURCE: "700",
            _DEFAULT_SOURCE: "1",
        }),
        libraries: [
            {
                include: ".",
            },
        ],
        optimizations: {
            development: {
                level: 0,
                lto: "",
                flags: [],
            },
            production: {
                level: 3,
                lto: "flto",
                flags: [],
            },
        },
        debug: {
            development: {
                flags: ["g"]
            },
            production: {
                flags: [],
            },
        },
        flags: {
            development: [],
            production: [],
        },
        directories: {
            target: "native",
            src: "src",
            bin: "bin",
            main: "main",
            test: "test",
            development: "development",
            production: "production",
        }.mapFields(path.of),
        filter: () => true,
    };
    
    function mergeRules(name: string, target: UserTarget, defaultTarget: TargetRule): TargetRule {
        function mergeFlags(get: (target: TargetRule | UserTarget) => Flags | undefined): Flags {
            return [
                ...new Set([...(get(defaultTarget) || []), ...(get(target) || [])])
            ];
        }
    
        function mergeProductionModes<T>(get: (target: TargetRule) => ProductionModes<T>): ProductionModes<T> {
            const _get = get as (target: UserTarget) => ProductionModes<T> | undefined;
            const defaultField = get(defaultTarget);
            const field: ProductionModes<T> = _get(target) || ({} as ProductionModes<T>);
            return {
                development: {
                    ...defaultField.development,
                    ...field.development,
                },
                production: {
                    ...defaultField.production,
                    ...field.production,
                },
            };
        }
    
        return {
            name,
            target: target.target,
            compiler: target.compiler || defaultTarget.compiler,
            standards: {
                ...defaultTarget.standards,
                ...target.standards,
            },
            tools: {
                ...defaultTarget.tools,
                ...target.tools,
            },
            warnings: mergeFlags(o => o.warnings),
            suppressErrors: mergeFlags(o => o.suppressErrors),
            macros: mergeProductionModes(o => o.macros),
            libraries: [
                ...defaultTarget.libraries,
                ...(target.libraries || []),
            ],
            optimizations: mergeProductionModes(o => o.optimizations),
            debug: mergeProductionModes(o => o.debug),
            flags: {
                development: mergeFlags(o => o.flags && o.flags.development),
                production: mergeFlags(o => o.flags && o.flags.production),
            },
            directories: Directories.fill(defaultTarget.directories, target.target),
            filter: target.filter || defaultTarget.filter,
        };
    }
    
    export function merge(name: string, target: UserTarget,
                          defaultTarget: TargetRule = defaultRule): Target {
        const rule = mergeRules(name, target, defaultTarget);
        return {
            rule,
            mode: mode => TargetMode.of(rule, mode)
        };
    }
    
}
