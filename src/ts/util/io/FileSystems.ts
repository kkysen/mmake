import {FileSystem} from "./FileSystem";

export namespace FileSystems {
    
    export const posix: FileSystem = FileSystem.make({
        name: "posix",
        separator: "/",
        root: {
            isValid: root => root === "/",
        },
        character: {
            isValid: c => !":/\"?*|<>\\".includes(c), // TODO
        },
    });
    
    export const windows: FileSystem = FileSystem.make({
        name: "Windows",
        separator: "\\",
        root: {
            isValid: root => root.endsWith(":\\"),
        },
        character: {
            isValid: c => !":/\"?*|<>\\".includes(c), // TODO
        },
    });
    
    export const current = process.platform == "win32" ? windows : posix;
    
}