# The sandbox / testing area. v4 coming soon.
from inspect import CO_VARARGS
from typing import Callable, Any
class run:
    _instance_ = None
    reroute: str | None = None
    def __new__(cls,*args):
        if cls._instance_ is None:
            cls._instance_ = super().__new__(cls)
        return cls._instance_
    
    def __init__(self,obj:dict[str,Any],start:str):
        if getattr(self,"running",False): return
        self.running = True
        self.reroute = None
        self.story: dict[str,Any] = obj
        self.rerouteMemory = []
        current = obj[start]
        self.current = current
        
        res = ''
        while True:
            # before func
            valid = (isinstance(current,list) and len(current) > 2) or (isinstance(current,end) and len(current) > 1) * 2
            index = None
            if valid:
                index = current[2 -(valid == 2)]
                if 'before' in index and callable(index['before']):
                    safeCall(index['before'],res,res in current[1])
                    if self.reroute and self.reroute in obj and self.handleReroute(self.reroute,obj,current):
                        current = obj[self.reroute]
                        self.reroute = None
                        continue
            
            # input
            res = self.option(current,res)
            # after func
            if valid and index and 'after' in index and callable(index['after']):
                safeCall(index['after'],res,res in current[1])
                if self.reroute in obj and self.handleReroute(self.reroute,obj,current):
                    current = obj[self.reroute]
                    self.reroute = None
                    continue
            if len(self.rerouteMemory) > 0:
                print('CLEARING REROUTE SIGNATURE: ' + listToString(self.rerouteMemory).replace(',',' >'))
                self.rerouteMemory.clear()
            
            if res is False: break
            if res in current[1]:
                keys = [*current[1]]
                if isinstance(keys[keys.index(res)],counter):
                    keys[keys.index(res)].use()
                current = obj[current[1][res]]
        self.running = False
        
    def handleReroute(self,location:str,obj,current) -> bool:
        if location in self.rerouteMemory:
            print('ERR: REROUTE LOOP DETECTED, REROUTE IGNORED')
            print('LOOP SIGNATURE:', listToString(self.rerouteMemory).replace(',',' >') + ' > ' + location)
            return False
        
        key: str = '[FIND_ERR]'
        for index,item in obj.items():
            if item is current:
                key = index

        if len(self.rerouteMemory) == 0:
            self.rerouteMemory.append(key)
        self.rerouteMemory.append(location)
        
        print(f'SUCCESSFUL REROUTE FROM {self.rerouteMemory[0]} TO {location}')
        print('REROUTE SIGNATURE: ' + listToString(self.rerouteMemory).replace(',',' >'))
        return True
         
    def option(self,current,res):
        print()        
        if isinstance(current,branch):
            if isinstance(current[0],f_string):
                nar = current[0].using(res,res in current[1])
            else: nar = current[0]
            
            for i in [*current[1]]:
                if isinstance(i,counter) and i.lifespan == 0:
                    del current[1][i]
            res = input(str(nar) + f' ( {listToString([*current[1]])} ) >> ')
        elif isinstance(current,(end,f_string,str)): 
            nar = current
            if isinstance(nar,end):
                nar = nar[0]
            if isinstance(nar,f_string):
                nar = nar.using(res)
            print(nar)
            return False
        return res

class counter:
    def __init__(self,key:Any,lifespan:int):
        self.key = key
        self.lifespan = lifespan
        self._original_lifespan = lifespan
    def __str__(self):
        if self.lifespan > 0:
            return self.key
        return '!LIFESPAN'

    def use(self):
        if self.lifespan > 0:
            self.lifespan -= 1
            return self.key
    
    def __repr__(self):
        return f'<Counter: {self.key}, {self.lifespan}>'
    
    def __hash__(self):
        return hash(self.key)
    
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
    def using(self,*args):
        string = self.string
        for i in self.map:
            insert = self.map[i]
            if callable(insert):
                insert = str(safeCall(insert,*args))
            string = string[: string.find('$' + i)] + insert + string[string.find('$' + i) + len(i) + 1 :]
        return string

class branch(list):
    def __init__(self,text:str | f_string,options:dict[str | counter | tuple[Any,...],str],functions: dict[str,Callable[..., Any]] = {}):
        super().__init__([text,unpack(options,value=True),functions])

class end(list):
    def __init__(self,text:str | f_string,functions: dict[str,Callable[..., Any]] = {}):
        super().__init__([text,functions])

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

def wrap(objs:list[Any] | tuple[Any,...],wrapper:type,args:tuple[Any,...] | list[Any] | Any) -> tuple:
    if not (isinstance(args,tuple) or isinstance(args,list)):
        args = [args]
    ret = []
    for i in objs:
        ret.append(wrapper(i,*args))
    ret = tuple(ret)
    return ret

def safeCall(func:Callable[...,Any],*args:Any) -> Any: 
    if bool(func.__code__.co_flags & CO_VARARGS):
        return func(*args)
    return func(*args[: func.__code__.co_argcount])

def reroute(location: str):
    print('ATTEMPTED REROUTE')
    if isinstance(run._instance_,run) and location in run._instance_.story:
        run._instance_.reroute = location

__all__ = [
    "wrap",
    "listToString",
    "f_string",
    "counter",
    "end",
    "branch",
    "run",
    'reroute'
]

if __name__ == "__main__":
    items = ['apple','knife','blender','gun','bazooka','banana']
    inventory = []
    loops = 0
    # story = {
    #     'take': branch(
    #         f_string(
    #             '$takeYou look at the table $againand see $items. Take...', {
    #                 'take':lambda res, worked: f'You took {listToString([res],True)}. ' if res in inventory else '',
    #                 'again':lambda res: 'again ' if res in inventory else '',
    #                 'items':lambda _: listToString(items,True) or 'nothing'
    #             }
    #         ),
    #         {wrap(items,counter,1):'take','nothing':'end'},
    #         {'after':lambda res, worked: (items.remove(res), inventory.append(res)) if res in items and worked else None}
    #     ),
        
    #     'end': end(f_string('you have $items',{'items':lambda _: listToString(inventory,True) or 'nothing'}))
    # }
    
    infTest = {
        'a': branch('AAA',{},{'before':lambda:reroute('b')}),
        'b': branch('BBB',{},{'after':lambda:reroute('a')})
    }



    # plan to add:
    # conditional option: check if condition true then reroute from chosen branch elsewhere
    # make the results able to map to lambdas, lambdas then return the branch


    # story = {
    #     'start.a':branch('Hello?',{'':'start.b'}),
    #     'start.b':branch('How are you?',{})
    # }

    runner = run(infTest,'a')
    
    # look down
