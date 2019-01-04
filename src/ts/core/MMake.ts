import {Config} from "./Config";
import {MMakeArgs} from "./MMakeArgs";
import {Target, Targets} from "./Target";

export interface MMakeTarget {
    
    make(): Promise<void>;
    
    run(args: ReadonlyArray<string>): Promise<void>;
    
}

const MMakeTarget = {
    
    of(targets: Targets): MMakeTarget {
        async function make(): Promise<void> {
            await targets.map(Target.makeFileGenerator)
                .asyncMap(f => f());
        }
        
        async function run(args: ReadonlyArray<string>): Promise<void> {
            await make();
            
        }
        
        return {make, run};
    },
    
};

export interface MMake {
    
    readonly config: Config;
    
    target(name: string): MMakeTarget;
    
    all(): MMakeTarget;
    
    run(args: ReadonlyArray<string>): Promise<void>;
    
}

export const MMake = {
    
    new(config: Config): MMake {
        function getTarget(name: string): MMakeTarget {
            const target = config.targets.find(target => target.target === name);
            if (!target) {
                throw new Error(`target "${name}" does not exist`);
            }
            return MMakeTarget.of([target]);
        }
        
        function getAllTargets(): MMakeTarget {
            return MMakeTarget.of(config.targets);
        }
        
        async function run(args: ReadonlyArray<string>): Promise<void> {
            const [targetArg, ...makeArgs] = args;
            const [mmake, targetName, run] = /(-?)([^:]*)(:?)/.exec(targetArg)!!;
            const target = targetName ? getTarget(targetName) : getAllTargets();
            if (run) {
                await target.run(makeArgs);
            } else if (mmake || !targetName) {
                await target.make();
            }
        }
        
        return {
            config,
            target: getTarget,
            all: getAllTargets,
            run,
        };
    },
    
    async run(args: MMakeArgs): Promise<void> {
        const config = await Config.load(args.configRequirePath);
        const mmake = MMake.new(config);
        await mmake.run(args.args);
    },
    
};