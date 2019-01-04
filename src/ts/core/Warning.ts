import {Flag} from "./Flag";
import {makeToString} from "./utils";

export type Warning = string;

export type Warnings = ReadonlyArray<Warning>;

export const {
    element: Warning,
    array: Warnings,
} = makeToString<Warning>(warning => Flag.toString(`W${warning}`));
