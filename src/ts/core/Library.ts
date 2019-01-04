import * as path from "path";
import {Dir} from "../util/io/Dir";
import {Flag, Flags} from "./Flag";
import {makeToString} from "./utils";

export interface Library {
    readonly include: Dir;
    readonly binary?: string;
}

export type Libraries = ReadonlyArray<Library>;

export const {
    element: LibraryInclude,
    array: LibraryIncludes,
} = makeToString<Library>(library => Flag.toString(`I${library.include}`));

export const {
    element: LibraryBinary,
    array: LibraryBinaries,
} = makeToString<Library>(library => {
    if (!library.binary) {
        return;
    }
    const {dir, name} = path.parse(library.binary);
    if (!dir) {
        // system library, interpret filename as library name
        return Flag.toString(`l${name}`);
    } else {
        // local library, interpret path as path to library binary
        if (!name.startsWith("lib")) {
            throw new Error(`${library.binary} must be a library file beginning with "lib"`);
        }
        return Flags.toString([
            `L${dir}`,
            `l${name.slice("lib".length)}`,
        ]);
    }
});
