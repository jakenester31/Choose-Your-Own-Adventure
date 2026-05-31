import {Engine,splitBranch, branch,map} from "./project.ts"

// Noob
const mRouter0: Engine.Tree = {
    "start":splitBranch("Morning, wanna grab coffee or tea?")
        .route(["coffee","tea","water"]),
    "coffee":branch("You take the coffee and drink. It's still hot."),
    "tea":branch("You take the tea and drink. It's mild."),
    "water":branch("You take the water and drink.")
}

// Pro
const mRouter1: Engine.Tree = {
    "start":splitBranch("Morning, wanna grab coffee, tea, or some water?")
        .route({"coffee":"taken","tea":"taken","water":"taken"}),
    "taken":branch(e => `You take the ${e} and drink it. ${ {"coffee":"It's still hot.","tea":"It's mild."}[e] ?? "" }`)
}

// Hacker
const mRouter2: Engine.Tree = {
    "start":splitBranch("Morning, wanna grab coffee, tea, or some water?")
        .route(map(["coffee","tea","water"],"taken")),
    "taken":branch(e => `You take the ${e} and drink it. ${ {"coffee":"It's still hot.","tea":"It's mild."}[e] ?? "" }`)
}

// God
const mRouter3: Engine.Tree = {
    "start":splitBranch("Morning, wanna grab coffee, tea, or some water?")
        .route(["coffee","tea","water"],"taken"),
    "taken":branch(e => `You take the ${e} and drink it. ${ {"coffee":"It's still hot.","tea":"It's mild."}[e] ?? "" }`)
}


// Noob
const Router0: Engine.Tree = {
    "start":branch("Route anywhere")
        .hook(e => engine.reroute(e)),
    "a":branch("You're at a!"),
    "b":branch("You're at b.")
}

// Pro
const Router1: Engine.Tree = {
    "start":branch("Route anywhere")
        .reroute(e => e),
    "a":branch("You're at a!"),
    "b":branch("You're at b!")
}

// Hacker
const Router2: Engine.Tree = {
    "start":branch("Route anywhere")
        .route("routed"),
    "routed":branch(e => `You're at ${e}!`)
}

// God
let at: string;
const Router3: Engine.Tree = {
    "start":branch(e => at ? `You're at ${at}` : "Route anywhere"  )
        .hook(e => at = e)
        .route("start")
}

const splitTest: Engine.Tree = {
    "start":branch("Name?")
        .route("named"),
    "named":branch(e => `Well hi ${e}`)
}

console.clear();
const engine: Engine = new Engine(Router3);
engine.begin("start");