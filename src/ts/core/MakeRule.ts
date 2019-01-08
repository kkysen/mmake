import {Path} from "../util/io/Path";

export interface MakeRule {
    readonly target: Path | string;
    readonly dependencies: Path | string;
    readonly commands: ReadonlyArray<string>;
    readonly phony: boolean;
}

export const MakeRule = {
    
    toString(rule: MakeRule) {
        const {target, dependencies} = rule;
        const commands = rule.commands.map(command => `\t${command}\n`);
        const phony = rule.phony ? `.PHONY: ${target}\n` : "";
        const s = `${target.toString()}: ${dependencies.toString()}\n${commands.join("")}${phony}`;
        return `${target.toString()}: ${dependencies.toString()}\n${commands.join("")}${phony}`;
    },
    
};