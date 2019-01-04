import Global = NodeJS.Global;
import {isBrowser} from "./anyWindow";

export const globalWindow: Window | Global = isBrowser ? window : global;