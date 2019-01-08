import {BaseValidator, Validator} from "../misc/Validator";
import {Path} from "./Path";
import {path, PathExtension} from "./pathExtensions";

export interface BaseFileSystem {
    
    readonly name: string;
    
    readonly separator: string;
    
    readonly root: BaseValidator<string>;
    readonly character: BaseValidator<string>;
    
}

export interface FileSystem {
    
    readonly name: string;
    
    readonly separator: string;
    
    readonly root: Validator<string>;
    readonly character: Validator<string>;
    readonly segment: Validator<string>;
    
    switchTo(): PathExtension<Path>;
    
}

export namespace FileSystem {
    
    export function make(
        {
            name,
            separator,
            root,
            character,
        }: BaseFileSystem
    ): FileSystem {
        function errorMessage(type: string): (t: string) => string {
            return t => {
                t = t.replace(`"`, `\\"`);
                return `invalid path ${type} on ${name} FileSystem: "${t}"`;
            };
        }
        
        return {
            name,
            separator,
            root: Validator.make({
                isValid: root.isValid,
                errorMessage: errorMessage("root"),
            }),
            character: Validator.make({
                isValid: character.isValid,
                errorMessage: errorMessage("character"),
            }),
            segment: Validator.make({
                isValid: segment => [...segment].every(character.isValid),
                errorMessage: errorMessage("segment"),
            }),
            switchTo() {
                return path.switchToFileSystem(this);
            }
        };
    }
    
}