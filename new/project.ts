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

            if ("message" in this.branch && (typeof this.branch.message == "string" || typeof this.branch.message == "function")) {
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

        for(let i of this.branch.reroutes[position]) {
            const res = i(this.input);
            if (res) this.rerouteTo = res;
        }
    }
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
    message(message:string|((input:string) => string)): string {
        if (!("message" in this.branch)) return "";
        if (typeof message == "function")
            return message(this.input) + " >> ";
        return message + " >> ";
    }
}

namespace Engine {
    export type Tree = Record<string,BaseBranch>
    export enum RerouteTiming { Deferred, Immediate }
    export type Reroute = (input:string) => string|null
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
    hooks: BaseBranch.Hooks = { [Hook.BEFORE]: [], [Hook.AFTER]: [] };
    reroutes: BaseBranch.Reroutes = { [Hook.BEFORE]: [], [Hook.AFTER]: [] };
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
    // Sugar for a hook that uses reroute, 
    // Reroute function always takes priority
    reroute(position:Hook.Types,callback:Engine.Reroute): typeof this;
    reroute(callback:Engine.Reroute): typeof this;
    reroute(a:Engine.Reroute|Hook.Types,b?:Engine.Reroute): typeof this {
        if (typeof a == "function")
            this.reroutes[Hook.AFTER].push(a);
        else if (typeof b == "function")
            this.reroutes[a].push(b);
        return this;
    }
    abstract route(data:any): typeof this;

    process(callback:BaseBranch.Process): typeof this {
        this.processors.push(callback);
        return this;
    }
    // Engine callbacks
    abstract _route(data:string|null): string|void;
    _process(input:string):string {
        for (let i of this.processors)
            input = i(input);
        return input;
    };
    abstract Flags: BaseBranch.Flags;
}

namespace BaseBranch {
    export enum Flags { AWAITINPUT = 1, FORCEINPUT = 2 }
    export type Hooks = Record<Hook.Types,Function[]>
    export type Reroutes = Record<Hook.Types,Engine.Reroute[]>
    export type Process = (input:string) => string
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
    _process(input: string): string { return super._process(input) }
    _route(_:any) { return this.nextNode }
    Flags: BaseBranch.Flags = BaseBranch.Flags.AWAITINPUT;
}

function branch(message:string|((input:string) => string)) {
    return new Branch(message);
}

class SplitBranch extends PublicBranch {
    private pairs: Record<string,string> = {};
    private readonly _message:string|((input:string) => string)
    get message() {
        const entries: string[] = Object.entries(Object.keys(this.pairs)).map( e => `${e[0]}. ${e[1]}`);
        return `${engine.message(this._message)}\n\t${entries.join("\n\t")}\nSelect`
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
    _process(input: string): string {
        input = Object.keys(this.pairs)[+input]
        return super._process(input)
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
        .route({"coffee":"taken","tea":"taken","water":"taken"}),
    "taken":branch(e => `You take the ${e} and drink it. ${ {"coffee":"It's still hot.","tea":"It's mild."}[e] ?? "" }`)
}


const oldRouter: Engine.Tree = {
    "start":branch("Route anywhere")
        .hook(e => engine.reroute(e)),
    "a":branch("You're at a!"),
    "b":branch("You're at b.")
}

const newRouter: Engine.Tree = {
    "start":branch("Route anywhere")
        .reroute(e => e),
    "a":branch("You're at a!"),
    "b":branch("You're at b.")
}

const english: Engine.Tree = {
    "start":branch("Its night out, been looking out from on top a roof all day.")
        .route("int scene"),
    "int scene": branch("Nothing has happened yet but still you look out.")
        .route("int scene 2"),
    "int scene 2": branch("Then suddenly, you see the flicker of a light from down the street on top another roof")
        .route("int scene 3"),
    "int scene 3": splitBranch("What do you do?")
        .route({
            "fire":"fire0",
            "move to another location":"move0"
        }),
    "fire0":branch("You aim and fire. The lights already out.")
        .route("think"),
    "move0":branch("You move to a better position, a bit closer to the roof")
        .route("think"),

    "think":branch("Somethings off.... You can't quite tell what it is.")
        .route("wait"),
    "wait": branch("You wait. Have to if you want to live.")
        .route("see"),
    "see": splitBranch("Eventually you see the enemies head move. You aim.")
        .route({
            "fire":"fire1"
        }),
    "fire1":branch("You fire, the shot is loud and the smell of gunpowder is unmistakable.")
        .route("false kill"),
    "false kill": splitBranch("An arm swings down the side of the roof, it slowly begins to slip.")
        .route({
            "Celebrate":"celebrate",
            "Celebrate ":"celebrate"
        }),
    "celebrate":branch("You get up, why wouldn't you. Your enemy is dead.")
        .route("cel1"),
    "cel1":branch("You win, you survive, you helped your country.")
        .route("nothing0"),
    "nothing0":branch("").route("nothing1"),
    "nothing1":branch("").route("nothing2"),
    "nothing2":branch("").route("end"),
    "end":branch("The body of a sniper falls to the ground. However, its not the enemies body.")
        .route("end2"),
    "end2":branch("Its your body that fell. You can't think anymore, you can barely even see.")
        .route("end3"),
    "end3":branch("So this is death.")
}

console.clear();
const engine: Engine = new Engine(english);
engine.begin("start");