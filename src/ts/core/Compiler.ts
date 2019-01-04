import {Languages} from "./Languages";

export interface Compiler {
    
    readonly compilers: Languages;
    readonly preprocessor: Languages;
    
    readonly ar: string;
    readonly ranlib: string;
    
}

function makeCompiler(compilers: Languages, prefix: string): Compiler {
    const cpp = (compiler: string) => `${compiler} -E`;
    return {
        compilers,
        preprocessor: compilers.mapFields(cpp),
        ar: `${prefix}-ar`,
        ranlib: `${prefix}-ranlib`,
    };
}

export const compilers = {
    gcc: makeCompiler({c: "gcc", cpp: "g++"}, "gcc"),
    clang: makeCompiler({c: "clang", cpp: "clang++"}, "llvm"),
    emscripten: makeCompiler({c: "emcc", cpp: "emcc"}, "llvm"),
};