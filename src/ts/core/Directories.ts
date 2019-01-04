import {Dir} from "../util/io/Dir";
import {Indexable} from "../util/types/indexable";
import {ProductionModes} from "./ProductionModes";

export interface Directories extends ProductionModes<Dir> {
    readonly src: Dir;
    readonly main: Dir;
    readonly test: Dir;
    readonly bin: Dir;
    readonly target: Dir;
}

export const Directories = {
    
    fill(directories: Directories, targetName: string): Directories {
        const dir = <T extends Indexable<Dir>>(files: T, dir: Dir): T =>
            files.mapFields<Dir, Dir>(e => dir.dir(e.path)) as T;
        const {src, bin, main, test, development, production} = directories;
        const target = bin.dir(targetName);
        return {
            src,
            ...dir({main, test}, src),
            bin,
            target,
            ...dir({development, production}, target),
        };
    },
    
};