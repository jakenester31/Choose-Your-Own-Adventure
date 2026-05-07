// Ts is being dumb and not checking global packages
// @ts-expect-error
import * as readline from 'node:readline/promises';
// @ts-expect-error
import { stdin, stdout } from 'node:process';

async function query(message:string) {
    const req = readline.createInterface({input:stdin,output:stdout});
    const ret = await req.question(message + " ");
    req.close();
    return ret;
}

class Hook {
    private readonly callback: Function
    constructor(callback:Function) {
        this.callback = callback;
    }
    attach(target:BaseBranch,position:Hook.Types) {
        target.hook(position,this.callback);
    }
}

namespace Hook {
    export enum Types { BEFORE = 'BEFORE', AFTER = 'AFTER' }
    export type BEFORE = Types.BEFORE;
    export const BEFORE = Types.BEFORE;
    export type AFTER = Types.AFTER;
    export const AFTER = Types.AFTER;
}

abstract class BaseBranch {
    private hooks: Branch.Hooks = { [Hook.BEFORE]: [], [Hook.AFTER]: [] };
    hook(position:Hook.Types,callback:Function): BaseBranch {
        this.hooks[position].push(callback);
        return this
    }
    abstract next(): BaseBranch
    abstract _next(): void
}

abstract class PublicBranch extends BaseBranch {
    abstract readonly message: string
}

abstract class PrivateBranch extends BaseBranch {

}

class Branch extends PublicBranch {
    readonly message: string
    constructor(message:string) {
        super();
        this.message = message;
    }
}

namespace Branch {
    export type Hooks = Record<Hook.Types,Function[]>
}