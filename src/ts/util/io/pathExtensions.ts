import {O_CREAT, O_EXCL} from "constants";
import {MakeDirectoryOptions, promises, Stats} from "fs";
import {CopyOptions, MoveOptions} from "fs-extra";
import * as os from "os";
import {production} from "../env/production";
import {ErrnoCode} from "../error/errno";
import {TODO} from "../error/todo";
import {FileSystem} from "./FileSystem";
import {FileSystems} from "./FileSystems";
import {fse, fsp} from "./fs";
import {Path} from "./Path";
import {PathExtension} from "./pathExtensions";

export interface PathExtension<R> {
    
    (path: Path): R;
    
}

export namespace path {
    
    import FileHandle = fsp.FileHandle;
    import ErrnoException = NodeJS.ErrnoException;
    
    // can't declare as const b/c conflicts with namespace is
    export function is(path: any): path is Path {
        return Path.is(path);
    }
    
    export function of(path: string | Path, fileSystem: FileSystem = FileSystems.posix) {
        if (is(path)) {
            return path.call(switchToFileSystem(fileSystem));
        }
        return Path.of(path, fileSystem);
    }
    
    export function switchToFileSystem(fileSystem: FileSystem): PathExtension<Path> {
        return path => {
            if (path.fileSystem === fileSystem) {
                return path;
            }
            if (path.isAbsolute) {
                throw new Error(`Can't switch FileSystem of absolute path: "${path.raw}"`);
            }
            return of(path.raw.replace(path.fileSystem.separator, fileSystem.separator), fileSystem);
        };
    }
    
    export function equals(path2: Path): PathExtension<boolean> {
        return path1 => path1.raw === path2.raw;
    }
    
    export function endsWith(suffix: Path): PathExtension<boolean>;
    export function endsWith(suffix: string): PathExtension<boolean>;
    export function endsWith(suffix: Path | string): PathExtension<boolean> {
        return path => path.raw.endsWith(suffix.toString());
    }
    
    export function startsWith(prefix: Path): PathExtension<boolean>;
    export function startsWith(prefix: string): PathExtension<boolean>;
    export function startsWith(prefix: Path | string): PathExtension<boolean> {
        return path => path.raw.startsWith(prefix.toString());
    }
    
    export const cwd = of(process.cwd(), FileSystems.current);
    export const toAbsolute: PathExtension<Path> = path => cwd.resolve(path);
    
    function fromStats<R>(statsFunc: (stats: Stats) => R): PathExtension<Promise<R>> {
        return async path => statsFunc(await path.stats);
    }
    
    function wrapRaw<R>(rawPathFunc: (rawPath: string) => R): PathExtension<R> {
        return path => rawPathFunc(path.raw);
    }
    
    export namespace is {
        export const directory = fromStats(e => e.isDirectory());
        export const file = fromStats(e => e.isFile());
        export const fifo = fromStats(e => e.isFIFO());
        export const socket = fromStats(e => e.isSocket());
        export const symbolicLink = fromStats(e => e.isSymbolicLink());
        export const characterDevice = fromStats(e => e.isCharacterDevice());
        export const blockDevice = fromStats(e => e.isBlockDevice());
    }
    
    export function access(mode?: number): PathExtension<Promise<ErrnoCode | null>> {
        return async path => {
            try {
                await promises.access(path.raw, mode);
                return null;
            } catch (e) {
                if (e instanceof Error) {
                    const {code} = e as ErrnoException;
                    if (code && code in os.constants.errno) {
                        return code as ErrnoCode;
                    }
                }
                throw e;
            }
        };
    }
    
    export function open(flags: string | number, mode?: string | number): PathExtension<Promise<FileHandle>> {
        if (production) {
            return wrapRaw(async path => {
                const fd = await fsp.open(path, flags, mode);
                console.log({fd: fd.fd, path: path});
                return fd;
            });
        }
        return wrapRaw(path => fsp.open(path, flags, mode));
    }
    
    export function temp(options?: {encoding?: BufferEncoding} | BufferEncoding): PathExtension<Promise<Path>> {
        return async path => {
            const temp = await path.call(create.directory.temp(options));
            await temp.call(remove.directory);
            return temp;
        };
    }
    
    open.temp = function(flags: string | number, mode?: string | number,
                         options?: {encoding?: BufferEncoding} | BufferEncoding,
    ): PathExtension<Promise<FileHandle & {readonly path: Path}>> {
        return async path => {
            const tmp = await path.call(temp(options));
            const fd = await tmp.call(open(flags, mode));
            return {
                ...fd,
                path: tmp,
            };
        };
    };
    
    export namespace copy {
        
        export function to(dest: Path, flags?: number): PathExtension<Promise<void>> {
            return src => fsp.copyFile(src.raw, dest.raw, flags);
        }
        
        export function from(src: Path, flags?: number): PathExtension<Promise<void>> {
            return dest => src.call(to(dest, flags));
        }
        
    }
    
    export namespace move {
        
        export function to(dest: Path, options?: MoveOptions): PathExtension<Promise<void>> {
            return src => fse.move(src.raw, dest.raw, options);
        }
        
        export function from(src: Path, options?: CopyOptions): PathExtension<Promise<void>> {
            return dest => src.call(to(dest, options));
        }
        
    }
    
    type BufferEncodingOptions = {encoding?: BufferEncoding | "buffer"} | BufferEncoding | "buffer" | undefined;
    
    type BufferEncodingOptionsFunc<String, Buffer> = {
        (options?: {encoding?: BufferEncoding} | BufferEncoding): PathExtension<Promise<String>>;
        (options?: {encoding: "buffer"} | "buffer"): PathExtension<Promise<Buffer>>;
    }
    
    function makeBufferEncodingOptionsFunc<String = string, Buffer = Buffer>(
        impl: (path: string, options: BufferEncodingOptions) => Promise<String | Buffer>
    ): BufferEncodingOptionsFunc<String, Buffer> {
        return ((options: BufferEncodingOptions): PathExtension<Promise<String | Buffer>> => {
            return wrapRaw(path => impl(path, options));
        }) as BufferEncodingOptionsFunc<String, Buffer>;
    }
    
    export namespace create {
        
        export function file(flags: number, mode?: number): PathExtension<Promise<void>> {
            return async path => {
                const fd = await path.call(open(flags | O_CREAT & ~O_EXCL, mode));
                await fd.close();
            };
        }
        
        file.temp = function(flags: number, mode?: number,
                             options?: {encoding?: BufferEncoding} | BufferEncoding,
        ): PathExtension<Promise<Path>> {
            return async path => {
                const tmp = await path.call(temp(options));
                await tmp.call(file(flags, mode));
                return tmp;
            };
        };
        
        export function directory(options?: MakeDirectoryOptions): PathExtension<Promise<void>> {
            return wrapRaw(path => fsp.mkdir(path, options));
        }
        
        const tempDirRaw = makeBufferEncodingOptionsFunc(fsp.mkdtemp);
        
        function tempDir(options?: {encoding?: BufferEncoding} | BufferEncoding): PathExtension<Promise<Path>> {
            return async path => (path.directory || of("")).resolve(await path.call(tempDirRaw(options)));
        }
        
        tempDir.raw = tempDirRaw;
        directory.temp = tempDir;
        
        export namespace link {
            
            export function to(dest: Path): PathExtension<Promise<void>> {
                return src => fsp.link(src.raw, dest.raw);
            }
            
            export function from(src: Path): PathExtension<Promise<void>> {
                return dest => src.call(to(dest));
            }
            
        }
        
        export namespace symLink {
            
            export function to(dest: Path): PathExtension<Promise<void>> {
                return src => fsp.symlink(src.raw, dest.raw);
            }
            
            export function from(src: Path): PathExtension<Promise<void>> {
                return dest => src.call(to(dest));
            }
            
        }
        
        export function fifo(): PathExtension<Promise<void>> {
            throw TODO();
        }
        
    }
    
    const rmdir: PathExtension<Promise<void>> = wrapRaw(fsp.rmdir);
    const unlink: PathExtension<Promise<void>> = wrapRaw(fsp.unlink);
    
    /**
     * Same as remove(3).
     */
    export async function remove(path: Path): Promise<void> {
        const remove = await path.call(is.directory) ? rmdir : unlink;
        return await path.call(remove);
    }
    
    remove.directory = rmdir;
    remove.file = unlink;
    
    export namespace directory {
        
        const listRaw = makeBufferEncodingOptionsFunc<string[], Buffer[]>(fsp.readdir);
        
        export function list(options?: {encoding?: BufferEncoding} | BufferEncoding): PathExtension<Promise<Path[]>> {
            return async path => (await path.call(listRaw(options)))
                .map(fileName => path.resolve(fileName));
        }
        
        list.raw = listRaw;
        
    }
    
    export namespace link {
        
        export const read = makeBufferEncodingOptionsFunc(fsp.readlink);
        
    }
    
    const toRealRawPath = makeBufferEncodingOptionsFunc(fsp.realpath);
    
    export function toReal(options?: {encoding?: BufferEncoding} | BufferEncoding): PathExtension<Promise<Path>> {
        return async path => of(await path.call(toRealRawPath(options)), path.fileSystem);
    }
    
    toReal.raw = toRealRawPath;
    
    export namespace json {
        
        // TODO
        
    }
    
}