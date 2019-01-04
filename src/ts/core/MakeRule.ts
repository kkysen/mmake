export interface MakeRule {
    readonly target: string;
    readonly dependencies: string;
    readonly commands: ReadonlyArray<string>;
    readonly phony: boolean;
}

export const MakeRule = {
    
    toString(rule: MakeRule) {
        const {target, dependencies} = rule;
        const commands = rule.commands.map(command => `\t${command}\n`);
        const phony = rule.phony ? `.PHONY: ${target}\n` : "";
        return `${target}: ${dependencies}\n${commands}${phony}`;
    },
    
};