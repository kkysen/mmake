import {Dir} from "../util/io/Dir";
import {Flag} from "./Flag";
import {makeToString} from "./utils";

export type IncludeDir = Dir;

export const {
    element: IncludeDir,
    array: IncludeDirs,
} = makeToString<IncludeDir>(include => Flag.toString(`I${include}`));