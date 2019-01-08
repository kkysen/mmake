import {O_WRONLY} from "constants";
import * as fs from "fs-extra";
import {MaybePromise} from "../maybePromise/MaybePromise";
import {isFunction, isString} from "../types/isType";
import {Path} from "./Path";
import {path} from "./pathExtensions";

export interface Creator {
    readonly create: () => Promise<void>;
}

export interface FileToCreate extends Creator {
    
    readonly path: Path;
    
}

export type FileContents = string | (() => MaybePromise<string>);

export const FileContents = {
    
    create(contents: FileContents): MaybePromise<string> {
        return isString(contents) ? contents : contents();
    },
    
};

export const FileToCreate = {
    
    of(_path: Path, contents: FileContents): FileToCreate {
        return {
            path: _path,
            create: async () => {
                const fd = await _path.call(path.open(O_WRONLY));
                await fd.writeFile(await FileContents.create(contents));
                await fd.close();
            },
        };
    }
    
};