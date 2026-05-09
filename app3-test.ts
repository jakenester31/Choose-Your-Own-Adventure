// Ts is being dumb and not checking global packages
// @ts-expect-error
import * as readline from 'node:readline/promises';
// @ts-expect-error
import { stdin, stdout } from 'node:process';

async function query(message:string): Promise<string> {
    const req = readline.createInterface({input:stdin,output:stdout});
    const ret = await req.question(message + " ");
    req.close();
    return ret;
}

class Engine {
    private readonly tree: Engine.Tree

    private key: BaseBranch.Name
    private value: BaseBranch
    private update(val:BaseBranch.Name) {
        this.key = val;
        this.value = this.tree[val];
    }

    private routeTo: BaseBranch.pName = null

    constructor(tree:Engine.Tree) {
        this.tree = tree;
        // To tell typescript the fuck the hell off
        this.key = ''
        this.value = {} as BaseBranch
    }

    async begin(branchName: BaseBranch.Name): Promise<void> {
        this.routeTo = branchName;
        while (true) {
            if (this.routeTo == null || !(this.routeTo in this.tree))
                break;
            this.update(this.routeTo);

            let ret: string
            if (this.value instanceof PublicBranch)
                ret = await query(this.value.message)
        } 
    }
}

namespace Engine {
    export type Tree = Record<string,BaseBranch>
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
    abstract next(data:any): typeof this
    abstract _next(data:any): BaseBranch.pName
}

namespace BaseBranch {
    export type Name = string
    export type pName = string|null
}

abstract class PublicBranch extends BaseBranch {
    abstract readonly message: string
}

abstract class PrivateBranch extends BaseBranch {

}

class Branch extends PublicBranch {
    readonly message: string
    private nextNode: BaseBranch.pName = null
    constructor(message:string) {
        super();
        this.message = message;
    }
    next(branchName:string) {
        this.nextNode = branchName
        return this
    }
    _next(_:undefined) { return this.nextNode }
}

namespace Branch {
    export type Hooks = Record<Hook.Types,Function[]>
}