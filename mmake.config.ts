import {UserConfig} from "./src/ts/core/Config";

export const mmake: UserConfig = {
    name: "mmake",
    targets: [
        {
            target: "native",
        },
        {
            target: "wasm",
        },
    ],
};