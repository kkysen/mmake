import {Path} from "../util/io/Path";
import {Flag} from "./Flag";
import {makeToString} from "./utils";

export type IncludeDir = Path;

export const {
    element: IncludeDir,
    array: IncludeDirs,
} = makeToString<IncludeDir>(include => Flag.toString(`I${include}`));