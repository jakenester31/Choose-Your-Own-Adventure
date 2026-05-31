//#o REMINDERS:

//#y Make reroute function overwrite 
//#y previous calls instead of layer on top

//#y Add traversal system to make tree have depth


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

export class Engine {
    private active: boolean = false

    declare private branchName: string;
    declare private branch: BaseBranch;
    private routeTo: string|null = null;
    private rerouteTo: string|null = null;
    private rerouteTiming: Engine.RerouteTiming = Engine.RerouteTiming.Deferred;
    private input:string = "";

    constructor(
        private readonly tree:Engine.Tree
    ) {}

    // Public
    reroute(branchName:string,timing:Engine.RerouteTiming = Engine.RerouteTiming.Deferred):void {
        this.rerouteTo = branchName;
        this.rerouteTiming = timing;
    }

    // Main
    async begin(branchName: string): Promise<void> {
        this.routeTo = branchName;
        if (this.active) return; // Silent fail multi begin
        this.active = true;
        while (true) {
            if (this.rerouteTo) { 
                this.routeTo = this.rerouteTo;
                this.rerouteTo = null;
            }
            if (this.routeTo == null || !(this.routeTo in this.tree))
                break;
            this.update(this.routeTo);
    
            this.handleHooks(Hook.BEFORE);
            if (this.rerouteTo) continue;

            if (this.branch.Flags & BaseBranch.Flags.DISPLAY) {
                if (this.branch.Flags & BaseBranch.Flags.AWAITINPUT) {
                    while (true) {
                        this.input = this.branch._process(await query(this.handleMessage()));
                        this.routeTo = this.branch._route(this.input) ?? null;
                        const valid: boolean = typeof this.routeTo == "string" && this.routeTo in this.tree
                        if (!(this.branch.Flags & BaseBranch.Flags.FORCEINPUT && !valid))
                            break;
                    }
                } else { 
                    console.log(this.handleMessage());
                    this.routeTo = this.branch._route(null) ?? null;
                }
                console.log();
            } else {
                this.routeTo = this.branch._route(null) ?? null;
            }

            this.handleHooks(Hook.AFTER);
        } 
        this.active = false;
    }

    // Helpers
    private handleHooks(position:Hook.Types) {
        for(let i of this.branch.hooks[position]) {
            i(this.input);
            if (this.rerouteTo && this.rerouteTiming & Engine.RerouteTiming.Immediate) break;
        }

        const res = this.branch.reroutes[position]?.(this.input)
        if (res) this.rerouteTo = res;
    }
    private update(val:string) {
        this.branchName = val;
        this.branch = this.tree[val];
    }
    private handleMessage():string {
        if (!("message" in this.branch)) return "";
        let message:Engine.Route = this.branch.message;
        return stringy(message,this.input) + " >> "
    }
}

export namespace Engine {
    export type Tree = Record<string,BaseBranch>
    export enum RerouteTiming { Deferred, Immediate }
    export type Route = string|Engine.Reroute|null|void
    export type Reroute = (input:string) => string|null|void
}

export class Hook {
    constructor(
        private readonly callback:Hook.Callback
    ) {}
    attach(target:BaseBranch,position:Hook.Types = Hook.AFTER):void {
        target.hook(position,this.callback);
    }
}

export namespace Hook {
    export enum Types { BEFORE = 'BEFORE', AFTER = 'AFTER' }
    export type BEFORE = Types.BEFORE;
    export const BEFORE = Types.BEFORE;
    export type AFTER = Types.AFTER;
    export const AFTER = Types.AFTER;
    export type Callback = (input:string) => void
}

export abstract class BaseBranch {
    hooks: BaseBranch.Hooks = { [Hook.BEFORE]: [], [Hook.AFTER]: [] };
    reroutes: BaseBranch.Reroutes = {};
    processors: BaseBranch.Process[] = [];
   
    hook(position:Hook.Types,callback:Hook.Callback): typeof this;
    hook(callback:Hook.Callback): typeof this;
    hook(a:Hook.Types|Hook.Callback,b?:Hook.Callback): typeof this {
        if (typeof a == "function")
            this.hooks[Hook.AFTER].push(a);
        else if (typeof b == "function")
            this.hooks[a].push(b);
        return this
    }
    // Reroute callback always takes priority
    reroute(position:Hook.Types,callback:Engine.Reroute): typeof this;
    reroute(callback:Engine.Reroute): typeof this;
    reroute(a:Engine.Reroute|Hook.Types,b?:Engine.Reroute): typeof this {
        if (typeof a == "function")
            this.reroutes[Hook.AFTER] = a;
        else if (typeof b == "function")
            this.reroutes[a] = b;
        return this;
    }

    abstract route(input:any): typeof this;

    process(callback:BaseBranch.Process): typeof this {
        this.processors.push(callback);
        return this;
    }
    // Engine callbacks
    abstract _route(data:string|null|void): string|null|void;
    _process(input:string):string {
        for (let i of this.processors)
            input = i(input);
        return input;
    };
    abstract Flags: BaseBranch.Flags;

    abstract readonly message: stringy
}

export namespace BaseBranch {
    export enum Flags {
        None = 0,
        AWAITINPUT = 1, 
        FORCEINPUT = 2,
        DISPLAY = 4
    }
    export type Hooks = Record<Hook.Types,Function[]>
    export type Reroutes = Partial<Record<Hook.Types,Engine.Reroute>>
    export type Process = (input:string) => string
}

export class Branch extends BaseBranch {
    private nextNode: string|null|void = null;
    constructor(
        readonly message:stringy
    ) {
        super();
    }
    route(branchName:string) {
        this.nextNode = branchName
        return this
    }
    _process(input: string): string { return super._process(input) }
    _route(_:any) { return this.nextNode }
    Flags: BaseBranch.Flags = BaseBranch.Flags.DISPLAY | BaseBranch.Flags.AWAITINPUT;
}

export function branch(message:stringy) {
    return new Branch(message);
}

export class SplitBranch extends BaseBranch {
    private pairs: Record<string,string> = {};
    get message() {
        const entries: string[] = Object.entries(Object.keys(this.pairs)).map( e => `${e[0]}. ${e[1]}`);
        return (e:string) => `${stringy(this._message,e)}\n\t${entries.join("\n\t")}\nSelect`
    }
    constructor(
        private readonly _message:Engine.Route
    ) {
        super();
    }
    route(pairs: Record<string,string>): typeof this; // Multiple aliased
    route(option:string,branchName:string): typeof this; // Singular aliased
    route(keyvalues:string[]): typeof this; // Multiple Exact
    route(keyvalue:string): typeof this; // Singular Exact
    route(options:string[],branchName:string): typeof this; // Multiple to singular
    route(a:Record<string,string>|string|string[],b?:string): typeof this {
        if (typeof a == "object")
            if (a instanceof Array)
                Object.assign(this.pairs,Object.fromEntries(a.map(
                    e => [e, b ?? e]
                ))); // a:Array b:string|void
            else Object.assign(this.pairs,a); // a: Record<string,string>
        else this.pairs[a] = b ?? a; // a:string b:string|void
        return this;
    }
    _route(res:string):string|undefined {
        return this.pairs[res];
    }
    _process(input: string): string {
        return Object.keys(this.pairs)[+(input || -1)];
    }
    Flags: BaseBranch.Flags = BaseBranch.Flags.DISPLAY | BaseBranch.Flags.AWAITINPUT | BaseBranch.Flags.FORCEINPUT;
}

export function splitBranch(message:Engine.Route) {
    return new SplitBranch(message);
}

// Helpers
export function stringy(message:Engine.Route,input:string) {
    if (typeof message == "function")
        return message(input);
    return message;
}

export type stringy = string|((input:string) => string)

export function map(keys:string[],value:string): Record<string,string> {
    return Object.fromEntries(keys.map(e => [e,value]))
}