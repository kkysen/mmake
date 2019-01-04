export namespace regex {
    
    export const toSource = function(regExp: RegExp): string {
        const {source, flags} = regExp;
        return `/${source}/${flags}`;
    };
    
    export const join = function(...regexes: RegExp[]): RegExp {
        const source = regexes.map(e => e.source).join("");
        const flagChars = regexes.map(e => e.flags).join("").split("");
        const flags = flagChars && [...new Set(flagChars)].join("");
        return new RegExp(source, flags);
    };
    
    export const matchAll = function(regex: RegExp, s: string): RegExpExecArray[] {
        if (!regex.global) {
            throw new Error("trying to matchAll with non global regex");
        }
        const matches = [];
        let match;
        while (match = regex.exec(s)) {
            matches.push(match);
        }
        return matches;
    };
    
}