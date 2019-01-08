import {Path} from "../util/io/Path";
import {Indexable} from "../util/types/indexable";
import {ProductionModes} from "./ProductionModes";

export interface Directories extends ProductionModes<Path> {
    readonly src: Path;
    readonly main: Path;
    readonly test: Path;
    readonly bin: Path;
    readonly target: Path;
}

export const Directories = {
    
    fill(directories: Directories, targetName: string): Directories {
        const dir = <T extends Indexable<Path>>(files: T, dir: Path): T =>
            files.mapFields<Path, Path>(dir.resolve.bind(dir)) as T;
        const {src, bin, main, test, development, production} = directories;
        const target = bin.resolve(targetName);
        return {
            src,
            ...dir({main, test}, src),
            bin,
            target,
            ...dir({development, production}, target),
        };
    },
    
};