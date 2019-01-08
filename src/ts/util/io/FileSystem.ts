import {BaseValidator, Validator} from "../misc/Validator";
import {Path} from "./Path";
import {path, PathExtension} from "./pathExtensions";

export interface BaseFileSystem {
    
    readonly name: string;
    
    readonly separator: string;
    
    readonly root: BaseValidator<string>;
    readonly character: BaseValidator<string>;
    
    readonly coerce: {
        character(character: string): string;
    }
    
}

export interface FileSystem {
    
    readonly name: string;
    
    readonly separator: string;
    
    readonly root: Validator<string>;
    readonly character: Validator<string>;
    readonly segment: Validator<string>;
    
    readonly coerce: {
        character(character: string): string;
        path(path: string): string;
    }
    
    switchTo(): PathExtension<Path>;
    
}

export namespace FileSystem {
    
    export function make(
        {
            name,
            separator,
            root,
            character,
            coerce,
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
                errorMessage: segment => {
                    const invalidChar = [...segment].find(character.isValid.negate());
                    return `${errorMessage("segment")(segment)} (${invalidChar})`;
                },
            }),
            coerce: {
                ...coerce,
                path: path => [...path].map(coerce.character).join("")
            },
            switchTo() {
                return path.switchToFileSystem(this);
            }
        };
    }
    
}