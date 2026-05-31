import {Engine,branch,splitBranch} from "./project.ts"

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
        .route("fire","fire1"),
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