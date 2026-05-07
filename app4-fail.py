from inspect import CO_VARARGS
from typing import Callable, Any
from datetime import datetime
from pathlib import Path
from json import dumps
# To do:
#x Logs system
# Reroute
# Lambda options
# Branch / end branch types
# f_strings
# unpack
# safeCall
# wrap
# listToString
# counter

class classproperty:
    def __init__(self, get): self.get = get
    def __get__(self,_,cls): return self.get(cls)
    
class counter:
    def __init__(self,key:Any,lifespan:int):
        self.key = key
        self.lifespan = lifespan
        self._original_lifespan = lifespan
    
    def __str__(self) -> str:
        if self.lifespan > 0:
            return self.key
        return '!LIFESPAN'

    def use(self):
        if self.lifespan > 0:
            self.lifespan -= 1
            return self.key
    
    def __repr__(self): return f'<Counter: {self.key}, {self.lifespan}>'
    def __hash__(self): return hash(self.key)
    
    def __eq__(self, other):
        if isinstance(other, counter): 
            return self.key == other.key
        elif isinstance(other, str):
            return self.key == other
        return NotImplemented
  
class f_string:
    def __init__(self,string:str,map:dict[str,Any]):
        self.string = string
        self.map = map
    
    def __str__(self): return self.using()
    def __repr__(self): return f'<"{self.string}", {self.map}>'
    def using(self,*args: Any) -> str:
        string = self.string
        for i in self.map:
            insert = self.map[i]
            if callable(insert):
                insert = str(safeCall(insert,*args))
            string = string[: string.find('$' + i)] + str(insert) + string[string.find('$' + i) + len(i) + 1 :]
        return string

def safe_f_string(string: str | f_string, *args:Any):
    if isinstance(string,f_string):
        string = string.using(*args)
    return string
    

class branch(list):
    def __init__(self,text:str | f_string,options:dict[str | counter | tuple[Any,...],str],functions: dict[str,Callable[..., Any]] = {}):
        super().__init__([text,unpack(options,value=True),functions])

class end(list):
    def __init__(self,text:str | f_string,functions: dict[str,Callable[..., Any]] = {}):
        super().__init__([text,functions])

def safeCall(func:Callable[...,Any],*args:Any) -> Any: 
    if bool(func.__code__.co_flags & CO_VARARGS):
        return func(*args)
    return func(*args[: func.__code__.co_argcount])

def wrap(objs:list[Any] | tuple[Any,...],wrapper:type,args:tuple[Any,...] | list[Any] | Any) -> tuple:
    if not (isinstance(args,tuple) or isinstance(args,list)):
        args = [args]
    ret = []
    for i in objs:
        ret.append(wrapper(i,*args))
    ret = tuple(ret)
    return ret

def listToString(items:list[Any],human:bool = False) -> str:
    string = ''
    if human:
        string += 'a'
        if items and items[0] and items[0][0].lower() in 'euioa': string += 'n'
        string += ' '
    for index,item in enumerate(items):
        if human and index == len(items) - 1 and len(items) > 1:
            string += 'and '
        
        string += str(item)
        
        if index < len(items) - 1:
            if len(items) > 2 or not human:
                string += ','
            string += ' '
    if string == 'a ': return ''
    return string

def unpack(obj:dict[Any,Any],value:bool = True) -> dict[Any,Any]:
    if not isinstance(obj,dict): return False
    temp = type(obj)()
    for i in obj:
        if isinstance(i,tuple):
            for index,item in enumerate(i):
                if value and isinstance(obj[i],tuple):
                    if len(obj[i]) > index: temp[item] = obj[i][index]
                else: temp[item] = obj[i]
        else: temp[i] = obj[i]
    return temp

class logger:
    def __init__(self,folder:Path | str):
        # folder
        if isinstance(folder,str):
            folder = Path(folder)
        if not folder.exists():
            try:
                folder.mkdir(parents=True, exist_ok=True)
            except OSError:
                folder = Path.home() / 'Downloads/CYOA_logs'
                folder.mkdir(parents=True, exist_ok=True)
                
        self.folder = folder
        self.files = []

    @property
    def target(self) -> Path:
        def newName(): return str(datetime.now().strftime("%Y-%m-%d")) + f'_p{len(self.files)}'
        def file(): return (self.folder / self.files[-1]).with_suffix(".txt")
        if len(self.files) == 0:
            self.files.append(newName())
       
        with open(file(),'a+') as f:
            f.seek(0)
            if sum(1 for _ in f) > 100:
                self.files.append(newName())
                file().touch()
        return file()

    def generic(self,type = 'undefined',*messages):
        indent = ' ' * (len(type) + 3)
        with open(self.target,'a+') as f:
            f.write(f'[{type.upper()}] {f'\n{indent}'.join(messages).replace('\n','\n' + indent)}\n')
    
    def throw(self,key:str):
        type = self.predefined[key][0]
        title = str(self.predefined[key][1])
        messages: list | tuple = self.predefined[key][2 :]
        messages = [str(i) for i in messages]
        # indent = ' ' * (len(str(type)) + 4)
        indent = ' ' * 8
        with open(self.target,'a+') as f:
            f.write(f'[{str(type)[: 4].upper()}]  {title}\n')
            f.write(indent + ('\n' + indent).join(messages).replace('\n','\n' + indent))
            f.write(f"\n{indent}Time stamp - " + datetime.now().strftime("%H:%M:%S"))
            f.write('\n\n')
    
    predefined: dict[str,list[str | f_string] | tuple[str | f_string,...]] = {
        'INVALID_START':[ 'CRIT',
            f_string('START KEY "$key" IS NOT CONTAINED IN ROOT OBJECT',{'key':lambda: engine.main.start}),
            'TERMINATING RUN INSTANCE',
            'OTHER TEXT'
        ],
        'VALID_START': [ 'SYST', 
            'SUCCESSFUL START', 
            f_string('$obj',{'obj':lambda: 'ROOT OBJECT = ' + dumps(engine.main.obj,indent=4)})
        ],
    }

class engine:
    # singleton
    __instance = None
    
    @classproperty
    def main(cls):
        return cls.__instance
        
    def __new__(cls,*args,**kwargs):
        if cls.__instance is None:
            cls.__instance = super().__new__(cls)
        return cls.__instance
    
    def __init__(self):
        self._reroute: str | None = None
        self.logs: logger = logger('E:/Vs projects/Choose-Your-Own-Adventure/Logs')
    
    # reroute
    @property
    def reroute(self) -> str | None:
        return self._reroute
    
    @reroute.setter
    def reroute(self,location):
        print('ATTEMPTING REROUTE', location)
        self._reroute = location
    
    # RUN
    def run(self,obj:dict[str,branch | end],start:str):
        self.current: branch | end
        self.obj = obj
        if not start in obj:
            self.start = start
            self.logs.throw('INVALID_START')
            return
        self.current = obj[start]
        self.logs.throw('VALID_START')

items = ['knife','blender']


story: dict[str,branch | end] = {
    'take':branch('You see a blender and knife, take one.',
        {wrap(items,counter,1):'take','nothing':'end'},
        # {'after':lambda res,worked: ''}
    ),
    'end':end('')
}


engine().run(story,'take')