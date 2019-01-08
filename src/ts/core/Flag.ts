import {makeToString} from "./utils";

export type Flag = string;

export type Flags = ReadonlyArray<Flag>;

export const {
    element: Flag,
    array: Flags,
} = makeToString<Flag>(flag => flag && `-${flag}`);
