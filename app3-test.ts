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

}

namespace Hook {
    export enum Types { BEFORE, AFTER }
    export type BEFORE = Types.BEFORE
    export type AFTER = Types.AFTER
}

class Branch {
    readonly message: string
    private hooks = {

    }
    constructor(message:string) {
        this.message = message
    }
    hook(position:Hook.Types,callback:Function) {

    }
}

namespace Branch {
    type 
}