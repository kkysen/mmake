import * as fs from "fs-extra";
import * as path from "path";
import {FileContents, FileToCreate} from "./FileToCreate";

export interface Dir extends FileToCreate {
    
    dir(dirName: string): Dir;
    
    file(fileName: string): string;
    
    fileToCreate(fileName: string, contents: FileContents): FileToCreate;
    
    ensureCreated(): this;
    
    ls(): Promise<string[]>;
    
}

interface DirClass {
    
    createDir: (path: string) => Promise<void>;
    
    of(dirPath: string): Dir;
    
}

export const Dir: DirClass = {
    
    createDir: fs.mkdir,
    
    of(dirPath: string): Dir {
        const file = (fileName: string) => path.join(dirPath, fileName);
        const _: Dir = {
            path: dirPath,
            dir: dirName => Dir.of(file(dirName)),
            file,
            create: () => fs.mkdir(dirPath),
            ensureCreated: () => ({
                ..._,
                create: () => fs.ensureDir(dirPath),
            }),
            fileToCreate: (fileName, contents) => FileToCreate.of(file(fileName), async () => {
                await _.ensureCreated().create();
                return await FileContents.create(contents);
            }),
            ls: () => fs.readdir(dirPath),
        };
        return _;
    },
    
};