import {Options, register, Register} from "ts-node";

export type RegisteredTsNode = Register;

export interface TsNode {
    
    readonly isRegistered: boolean;
    readonly registered: RegisteredTsNode;
    
    register(): void;
    
    unRegister(): void;
    
}

export namespace TsNode {
    
    export function create(options?: Options): TsNode {
        const oldExtensions: NodeExtensions = {...require.extensions};
        let newExtensions: NodeExtensions | undefined;
        const registered = register(options);
        let isRegistered = true;
        const _ = {
            
            registered,
            
            get isRegistered() {
                return isRegistered;
            },
            
            register() {
                if (newExtensions) {
                    require.extensions = newExtensions;
                }
            },
            
            unRegister() {
                newExtensions = require.extensions;
                require.extensions = oldExtensions;
            }
            
        };
        _.unRegister();
        return _;
    }
    
}