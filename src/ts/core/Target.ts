import {O_CREAT, O_WRONLY} from "constants";
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

export interface Target {
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
    readonly directories: Directories;
}

export type Targets = ReadonlyArray<Target>;

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
}

export type UserTargets = ReadonlyArray<UserTarget>;

interface TargetClass {
    
    readonly default: Target;
    
    merge(name: string, target: UserTarget, defaultTarget?: Target): Target;
    
    toMakeFile(target: Target, mode: ProductionMode): string;
    
    makeFileGenerator(target: Target): () => Promise<void>;
    
}

export const Target: TargetClass = {
    
    default: {
        name: "a",
        target: "native",
        compiler: compilers.gcc,
        standards: {
            c: "11",
            cpp: "17",
        },
        tools: {
            valgrind: "valgrind --leak-check=full --show-leak-kinds=all",
            callgrind: "valgrind --tool=callgrind",
            massif: "valgrind --tool=massif",
            
            mkdir: "mkdir -p",
            rm: "rm",
            find: "find",
        },
        warnings: ["all", "error", "extra"],
        suppressErrors: [],
        macros: (() => {
            const macros = {
                _POSIX_C_SOURCE: "201901L",
                _XOPEN_SOURCE: "700",
                _DEFAULT_SOURCE: "1",
            };
            return {
                development: macros,
                production: macros,
            };
        })(),
        libraries: [
            {
                include: path.of("."),
            }
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
        directories: {
            target: "native",
            src: "src",
            bin: "bin",
            main: "main",
            test: "test",
            development: "development",
            production: "production",
        }.mapFields(path.of),
    },
    
    merge(name: string, target: UserTarget, defaultTarget: Target = Target.default): Target {
        const mergeFlags = (get: (target: Target | UserTarget) => Flags | undefined): Flags => {
            return [
                ...new Set([...(get(defaultTarget) || []), ...(get(target) || [])])
            ];
        };
        
        function mergeProductionModes<T>(get: (target: Target) => ProductionModes<T>): ProductionModes<T> {
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
            directories: Directories.fill(defaultTarget.directories, target.target),
        };
    },
    
    toMakeFile(target: Target, mode: ProductionMode): string {
        const {name, compiler, standards, tools, directories} = target;
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
        
        const vars = (() => {
            const sources = "SRCS";
            const objects = "OBJS";
            const testSources = "TEST_SRCS";
            const testObjects = "TEST_OBJS";
            const libObjects = "LIB_OBJS";
            const dependencies = "DEPS";
            const {src, [mode]: out, test} = directories;
            const matchSources = Object.keys(compilers)
                .map(ext => `-name "*.${ext}"`).join(" -or ");
            function sourcesToObjects(sources: string, objects: string) {
                return `${objects} := $(${sources}:${src.resolve("%")}=${out.resolve("%.o")})`;
            }
            return {
                names: {
                    sources,
                    objects,
                    testObjects,
                    libObjects,
                    dependencies,
                },
                declarations: [
                    `${sources} := $(shell ${tools.find} ${src} ${matchSources})`,
                    sourcesToObjects(sources, objects),
                    `${testSources} := $(filter ${test.resolve("%")} $(${sources}))`,
                    sourcesToObjects(testSources, testObjects),
                    `${libObjects} := $(filter-out $(${testObjects}),$(${objects}))`,
                    `${dependencies} := $(${objects}:.o=.d)`,
                ],
            };
        })();
        
        const flags = (() => {
            const flags = (() => {
                const {warnings, suppressErrors, macros, libraries, debug, optimizations} = target;
                return {
                    warnings: Warnings.toString(warnings),
                    suppressErrors: SuppressErrors.toString(suppressErrors),
                    macros: Macros.toString(macros[mode]),
                    include: LibraryIncludes.toString(libraries),
                    loadLibraries: LibraryBinaries.toString(libraries),
                    debug: Debug.toString(debug[mode]),
                    lto: Flag.toString(optimizations[mode].lto),
                    optimizations: Optimizations.toString(optimizations[mode]),
                };
            })();
            const {warnings, suppressErrors, macros, include, debug, lto, optimizations} = flags;
            const common = [debug, warnings, suppressErrors, optimizations, macros, include].join(" ");
            const {c, cpp} = standards;
            const std = (version: string) => `-std=${version} ${common}`;
            return {
                ...flags,
                preprocessor: [include, macros, Flags.toString(["MMD", "MP"])].join(" "),
                c: std(`c${c}`),
                cpp: std(`c++${cpp}`),
                link: [debug, lto].join(" "),
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
        
        const ownLibrary: Library = {
            include: path.of("."),
            binary: out.lib,
        };
        
        const rules: MakeRule[] = [
            objectRule("c"),
            objectRule("cpp"),
            {
                target: out.lib,
                dependencies: "$(LIB_OBJS)",
                commands: [
                    `${compiler.ar} rc ${out.lib} $^`,
                    `${compiler.ranlib} ${out.lib}`,
                ],
                phony: false,
            },
            {
                target: out.test,
                dependencies: `${out.lib} $(TEST_OBJS)`,
                commands: [
                    `${compilers.c} ${flags.link} $(OBJS) -o $@ ${flags.loadLibraries} ${LibraryBinary.toString(
                        ownLibrary)}`,
                ],
                phony: false,
            },
            {
                target: out.exe,
                dependencies: `$(OBJS)`,
                commands: [
                    `${compilers.c} ${flags.link} $(OBJS) -o $@ ${flags.loadLibraries}`,
                ],
                phony: false,
            },
            {
                target: "lib",
                dependencies: out.lib,
                commands: [],
                phony: true,
            },
            executeRule("test", out.test),
            executeRule("run", out.exe),
            {
                target: "all",
                dependencies: [out.lib, out.test, out.exe].join(" "),
                commands: [],
                phony: true,
            },
            {
                target: "clean",
                dependencies: "",
                commands: [
                    `${tools.rm} -r ${directories.bin}`,
                ],
                phony: true,
            },
        ];
        const a = [
            vars.declarations.join("\n"),
            ...rules.map(MakeRule.toString),
            `-include $(${vars.names.dependencies})`,
            "",
        ];
        return [
            vars.declarations.join("\n"),
            ...rules.map(MakeRule.toString),
            `-include $(${vars.names.dependencies})`,
            "",
        ].join("\n\n");
    },
    
    makeFileGenerator(target: Target): () => Promise<void> {
        const {development, production} = target.directories;
        return () => Object.entries({development, production})
            .map(([mode, dir]) => ({mode, dir}))
            .map(({mode, dir}) => ({
                dir,
                file: dir.resolve("Makefile"),
                contents: Target.toMakeFile(target, mode),
            }))
            .asyncForEach(async ({dir, file, contents}) => {
                await dir.call(path.create.directory({recursive: true}));
                const fd = await file.call(path.open(O_WRONLY | O_CREAT));
                await fd.writeFile(contents);
                await fd.close();
            });
    },
    
};
