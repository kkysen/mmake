import {Stats} from "fs";
import {isString} from "../types/isType";
import {FileSystem} from "./FileSystem";
import {fsp} from "./fs";

export interface Path {
    
    readonly fileSystem: FileSystem;
    
    readonly raw: string;
    
    toString(): string;
    
    readonly root?: Path;
    readonly directory?: Path;
    readonly fileName?: Path;
    
    readonly extensionLessFileName?: string;
    readonly extension?: string;
    
    readonly isAbsolute: boolean;
    readonly isRelative: boolean;
    readonly isRoot: boolean;
    readonly isEmpty: boolean;
    
    resolve(path: Path | string): Path;
    
    // normally actual filesystem access is kept separate from Path class
    // and delegated to .call() extensions
    // but stats will be called often and I want to cache it
    readonly stats: Promise<Stats>;
    readonly exists: Promise<boolean>;
    
    // resets stats and exists
    reset(): void;
    
    /**
     * Allow for extension functions that can be imported separately (reducing code size)
     *
     * e.x. path.call(fs.exists)
     */
    call<R>(func: (path: this) => R): R;
    
}

abstract class BasePath implements Path {
    
    readonly fileSystem: FileSystem;
    
    readonly raw: string;
    
    protected constructor(fileSystem: FileSystem, raw: string) {
        this.fileSystem = fileSystem;
        this.raw = raw;
    }
    
    toString() {
        return this.raw;
    }
    
    get isRoot() {
        return false;
    }
    
    get isEmpty() {
        return this.raw === "";
    }
    
    abstract readonly isAbsolute: boolean;
    
    get isRelative() {
        return !this.isAbsolute;
    }
    
    abstract readonly root?: Path;
    abstract readonly directory?: Path;
    abstract readonly fileName?: Path;
    
    abstract readonly extensionLessFileName?: string;
    abstract readonly extension?: string;
    
    protected appendFile(path: FilePath) {
        if (this.isEmpty) {
            return path;
        }
        return new ChainedPath(this.fileSystem, this, path);
    }
    
    protected splitAtRoot(path: string = this.raw): {
        readonly root?: string;
        readonly relative: string;
    } {
        const fs = this.fileSystem;
        const index = path.indexOf(fs.separator);
        if (index !== -1) {
            const root = path.slice(0, index + 1);
            if (fs.root.isValid(root)) {
                return {
                    root,
                    get relative() {
                        return path.slice(index + 1, path.length);
                    },
                };
            }
        }
        return {relative: path};
    }
    
    protected appendRaw(path: string) {
        const fs = this.fileSystem;
        // easier to re-parse, since stored as singly linked list makes it hard to iterate
        let result: Path = this;
        const {root, relative} = this.splitAtRoot(path);
        if (root !== undefined) {
            result = new RootPath(fs, root);
        }
        for (const part of relative.split(fs.separator)) {
            const filePath = new FilePath(fs, part);
            result = result.isEmpty
                ? filePath
                : filePath.isEmpty
                    ? result
                    : new ChainedPath(fs, result, filePath);
        }
        return result;
    }
    
    resolve(path: Path | string): Path {
        const fs = this.fileSystem;
        if (isString(path)) {
            if (path === "") {
                return this;
            } else if (fs.root.isValid(path)) {
                return new RootPath(fs, path);
            } else {
                return this.appendRaw(path);
            }
        } else {
            if (this.isEmpty) {
                return path;
            } else if (path.isEmpty) {
                return this;
            } else if (path instanceof RootPath) {
                return path;
            } else if (path instanceof FilePath) {
                return this.appendFile(path);
            } else {
                return this.appendRaw(path.raw);
            }
        }
    }
    
    // null means path doesn't exist
    _stats?: Promise<Stats> = undefined;
    
    reset() {
        this._stats = undefined;
    }
    
    private getStats(): Promise<Stats> {
        return this._stats || (this._stats = fsp.stat(this.raw));
    }
    
    get stats() {
        return this.getStats();
    }
    
    get exists() {
        return (async () => {
            try {
                await this.getStats();
                return true;
            } catch {
                return false;
            }
        })();
    }
    
    call<R>(func: (path: this) => R): R {
        return func(this);
    }
    
}

class RootPath extends BasePath {
    
    constructor(fileSystem: FileSystem, root: string) {
        super(fileSystem, root);
        fileSystem.root.check(root);
    }
    
    get isAbsolute() {
        return true;
    }
    
    get isRoot() {
        return true;
    }
    
    get root() {
        return this;
    }
    
    get directory() {
        return undefined;
    }
    
    get fileName() {
        return undefined;
    }
    
    get extensionLessFileName() {
        return undefined;
    }
    
    get extension() {
        return undefined;
    }
    
}

class FilePath extends BasePath {
    
    private readonly extensionIndex: number;
    
    constructor(fileSystem: FileSystem, fileName: string) {
        super(fileSystem, fileName);
        fileSystem.segment.check(fileName);
        const index = fileName.lastIndexOf(".");
        this.extensionIndex = index !== -1 ? index : fileName.length;
    }
    
    static empty(fileSystem: FileSystem) {
        return new FilePath(fileSystem, "");
    }
    
    static isFilePath(fileSystem: FileSystem, path: string): boolean {
        const index = path.indexOf(fileSystem.separator);
        return index === -1 || (index === path.length - 1 && path !== "/");
    }
    
    get isAbsolute() {
        return false;
    }
    
    get root() {
        return undefined;
    }
    
    get directory() {
        return undefined;
    }
    
    get fileName() {
        return this;
    }
    
    get extensionLessFileName() {
        return this.raw.slice(0, this.extensionIndex);
    }
    
    get extension() {
        return this.raw.slice(this.extensionIndex, this.raw.length);
    }
    
}

class ChainedPath extends BasePath {
    
    readonly directory: Path;
    readonly fileName: FilePath;
    
    constructor(fileSystem: FileSystem, directory: Path, fileName: FilePath) {
        super(fileSystem, `${directory.raw}${directory.isRoot ? "" : fileSystem.separator}${fileName.raw}`);
        this.directory = directory;
        this.fileName = fileName;
    }
    
    get isAbsolute() {
        return this.splitAtRoot().root !== undefined;
    }
    
    get root() {
        // don't walk linked list, b/c O(n)
        // re-parse from raw path string so O(1)
        const {root} = this.splitAtRoot();
        return root === undefined
            ? undefined
            : new RootPath(this.fileSystem, root);
    }
    
    get extensionLessFileName() {
        return this.fileName.extensionLessFileName;
    }
    
    get extension() {
        return this.fileName.extension;
    }
    
}

export namespace Path {
    
    export function of(path: string, fileSystem: FileSystem): Path {
        const empty = FilePath.empty(fileSystem);
        return path ? empty.resolve(path) : empty;
    }
    
}