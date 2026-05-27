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
        outer: while (true) {
            if (this.rerouteTo) { 
                this.routeTo = this.rerouteTo;
                this.rerouteTo = null;
            }
            if (this.routeTo == null || !(this.routeTo in this.tree))
                break;
            this.update(this.routeTo);
            
            for(let i of this.branch.hooks.BEFORE) {
                i(this.input);
                if (this.rerouteTo && this.rerouteTiming & Engine.RerouteTiming.Immediate) continue outer;
            }
            if (this.rerouteTo) continue;

            if ("message" in this.branch && (typeof this.branch.message == "string" || typeof this.branch.message == "function")) {
                if (this.branch.Flags & BaseBranch.Flags.AWAITINPUT) {
                    while (true) {
                        this.input = await query(this.handleMessage());
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
            }

            for(let i of this.branch.hooks.AFTER) {
                i(this.input);
                if (this.rerouteTo && this.rerouteTiming & Engine.RerouteTiming.Immediate) continue outer;
            }

        } 
        this.active = false;
    }

    // Helpers
    private update(val:string) {
        this.branchName = val;
        this.branch = this.tree[val];
    }
    private handleMessage():string {
        if (!("message" in this.branch)) return "";
        const message:string|((input:string) => string) = this.branch.message as any;
        if (typeof message == "function")
            return message(this.input) + " >> ";
        return message + " >> ";
    }
}

namespace Engine {
    export type Tree = Record<string,BaseBranch>
    export enum RerouteTiming { Deferred, Immediate }
}

class Hook {
    constructor(
        private readonly callback:Hook.Callback
    ) {}
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
    export type Callback = (data:string)=>string|void
}

abstract class BaseBranch {
    public hooks: BaseBranch.Hooks = { [Hook.BEFORE]: [], [Hook.AFTER]: [] };
    hook(position:Hook.Types,callback:Hook.Callback): typeof this {
        this.hooks[position].push(callback);
        return this
    }
    abstract route(data:any): typeof this
    abstract _route(data:string|null): string|void
    abstract Flags: BaseBranch.Flags
}

namespace BaseBranch {
    export enum Flags { AWAITINPUT = 1, FORCEINPUT = 2 }
    export type Hooks = Record<Hook.Types,Function[]>
}

abstract class PublicBranch extends BaseBranch {
    abstract readonly message: string|((input:string) => string)
}

abstract class PrivateBranch extends BaseBranch {

}

class Branch extends PublicBranch {
    private nextNode: string|undefined = undefined
    constructor(
        readonly message:string|((input:string) => string)
    ) {
        super();
    }
    route(branchName:string) {
        this.nextNode = branchName
        return this
    }
    _route(_:unknown) { return this.nextNode }
    Flags: BaseBranch.Flags = BaseBranch.Flags.AWAITINPUT
}

function branch(message:string|((input:string) => string)) {
    return new Branch(message);
}

class SplitBranch extends PublicBranch {
    private pairs: Record<string,string> = {};
    private readonly _message:string|((input:string) => string)
    get message() {
        return `${this._message} (${Object.keys(this.pairs).join(", ")})`
    }
    constructor(
        message:string|((input:string) => string)
    ) {
        super();
        this._message = message;
    }
    route(pairs: Record<string,string>): typeof this;
    route(option:string,nodeName:string): typeof this;
    route(keyvalue:string): typeof this; // option exactly maps to branchName
    route(keyvalues:string[]): typeof this;
    route(a:Record<string,string>|string|string[],b?:string) {
        if (typeof a == "object") {
            if (a instanceof Array)
                Object.assign(this.pairs,Object.fromEntries(a.map(e => [e,e])));
            else Object.assign(this.pairs,a);
        } else if (typeof b == "string") {
            this.pairs[a] = b;
        } else {
            this.pairs[a] = a;
        }
        return this;
    }
    _route(res:string):string|undefined {
        return this.pairs[res];
    }
    Flags: BaseBranch.Flags = BaseBranch.Flags.AWAITINPUT | BaseBranch.Flags.FORCEINPUT;
}

function splitBranch(message:string|((input:string) => string)) {
    return new SplitBranch(message);
}

// TEST
const tesa: Engine.Tree = {
    "start": branch("Hello world")
        .route("next"),
    "next": branch("Goodbye world")
}

const tesb: Engine.Tree = {
    "start":splitBranch("Morning, wanna grab coffee or tea?")
        .route(["coffee","tea"]),
    "coffee":branch("You take the coffee and drink. It's still hot."),
    "tea":branch("You take the tea and drink. It's mild.")
}

const tesc: Engine.Tree = {
    "start":splitBranch("Morning, wanna grab coffee or tea?")
        .route({"coffee":"taken","tea":"taken"}),
    "taken":branch(e => `You take the ${e} and drink it. ${ {"coffee":"It's still hot.","tea":"It's mild."}[e] }`)
}


const router: Engine.Tree = {
    "start":branch("Route anywhere")
        .hook(Hook.AFTER, e => engine.reroute(e)),
    "a":branch("You're at a!"),
    "b":branch("You're at b.")
}


let user:string = '';
const english: Engine.Tree = {
    "start":branch("Hi, What is your name?")
        .route("start.a")
        .hook(Hook.AFTER,e => { if (e.trim().length == 0) engine.reroute("start",Engine.RerouteTiming.Immediate) })
        .hook(Hook.AFTER,e => user = e),
    "start.a":branch(() => `Hello ${user} you can call me Narrator.`)
        .route("start.b"),
    "start.b":branch(`A couple instructions beforehand:\n\t1. Press ctrl + c and then up arrow + enter to restart.\n\t2. Please do not type anything into the console when you're outside the game\n`)
}

console.clear();
const engine: Engine = new Engine(english);
engine.begin("start");