import {Path} from "../util/io/Path";
import {path} from "../util/io/pathExtensions";
import {Flag, Flags} from "./Flag";
import {makeToString} from "./utils";

export interface Library {
    readonly include?: Path | string;
    readonly binary?: Path | string;
}

export type Libraries = ReadonlyArray<Library>;

export const {
    element: LibraryInclude,
    array: LibraryIncludes,
} = makeToString<Library>(({include}) => include && Flag.toString(`I${include}`));

export const {
    element: LibraryBinary,
    array: LibraryBinaries,
} = makeToString<Library>(({binary}) => binary && (() => {
    const {directory, extensionLessFileName: fileName} = path.of(binary);
    if (!fileName) {
        throw new Error(`library.binary must have a Path.fileName`);
    }
    if (!directory) {
        // system library, interpret filename as library name
        return Flag.toString(`l${fileName}`);
    } else {
        const lib = "lib";
        // local library, interpret pathLib as pathLib to library binary
        if (!fileName.startsWith(lib)) {
            throw new Error(`${binary} must be a library file beginning with "${lib}"`);
        }
        return Flags.toString([
            `L${directory}`,
            `l${fileName.slice(lib.length)}`,
        ]);
    }
})());
