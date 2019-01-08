export interface BaseValidator<T> {
    
    isValid(t: T): boolean;
    
    errorMessage?: (t: T) => string;
    
}

export interface Validator<T> {
    
    isValid(t: T): boolean;
    
    errorMessage(t: T): string;
    
    check(t: T): void;
    
}

export class ValidationError extends Error {}

export namespace Validator {
    
    export function make<T>(
        {
            isValid,
            errorMessage = t => `${t} is not valid`,
        }: BaseValidator<T>
    ): Validator<T> {
        return {
            isValid,
            errorMessage,
            check: (t: T): void => {
                if (!isValid(t)) {
                    throw new ValidationError(errorMessage(t));
                }
            }
        };
    }
    
}