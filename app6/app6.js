class engine {
    constructor(object,start) {
        this.object = object;
    }
    input(choice) {

    }
}

class f_string {
    constructor(string,obj) {
        Object.assign(this,{string,obj});
    }

    map(args) {
        let string = this.string;
        for (let i in this.obj) 
            string = string.replace(`{${i}}`,safeCall(this.obj[i],...args[i] || ''));
        return string;
    }
}

function safeCall(func,...args) {
    return typeof func == 'function' ? func(...args) : func
}

const story = {
    start: ['Choose a or b', {a:'a',b:'b'}],
    a: ['choose b', {b:'b'}],
    b: 'The end'
}
const inst = new engine(story,'start');
