import {Flag} from "./Flag";
import {makeToString} from "./utils";

export type SuppressError = string;

export type SuppressErrors = ReadonlyArray<SuppressError>;

export const {
    element: SuppressError,
    array: SuppressErrors,
} = makeToString<SuppressError>(error => Flag.toString(`Wno-error=${error}`));