import * as fs from "fs-extra";
import {MaybePromise} from "../maybePromise/MaybePromise";
import {isFunction, isString} from "../types/isType";

export interface Creator {
    readonly create: () => Promise<void>;
}

export interface FileToCreate extends Creator {
    
    readonly path: string;
    
}

export type FileContents = string | (() => MaybePromise<string>);

export const FileContents = {
    
    create(contents: FileContents): MaybePromise<string> {
        return isString(contents) ? contents : contents();
    },
    
};

export const FileToCreate = {
    
    of(path: string, contents: FileContents): FileToCreate {
        return {
            path,
            create: async () => await fs.writeFile(path, await FileContents.create(contents)),
        };
    }
    
};