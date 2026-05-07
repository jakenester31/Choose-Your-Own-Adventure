from inspect import CO_VARARGS
from typing import Callable, Any

class singleton:
    _instance = None
    def __new__(cls,*args,**kwargs): return (setattr(cls,'_instance',super().__new__(cls)) if not cls._instance else 0) or cls._instance

class engine(singleton):
    def __init__(self):
        self.running = False
    
    def start(self,object,start):
        if getattr(self,"running",False): return
        self.running = True
        self.current = object[start]
        self.current_key = start
        self.history = []
        while self.running:
            self.select()
        self.running = False # makes sure if a break happens, it still reflects
        
    def select(self):
        print('')
        res = input(self.current[0] + f' ({self.current[1]})')
        

class f_string:
    def __init__(self,string: str,map: dict): self.string, self.map = string, map
    def __repr__(self) -> str: return f'<"{self.string}", {self.map}>'
    def __str__(self) -> str: return self.using()
    def using(self,**kargs: tuple[Any,...] | list[Any] | Any):
        temp = self.string
        return str([ temp := temp.replace(f'{{{i}}}',str(safeCall(self.map[i],*(kargs.get(i) or ())))) for i in self.map] and temp)

def safeCall(func:Callable[...,Any] | Any,*args:Any) -> Any: 
    return func(*args[:(None if (e := func.__code__).co_flags & CO_VARARGS else e.co_argcount)]) if callable(func) else func

def join(items: list[Any] | tuple[Any,...],beforeFirst: bool | str = False, beforeLast: bool | str = False):
    items = [str(i) for i in items]
    match beforeFirst: 
        case False | "": beforeFirst = ''
        case True: beforeFirst = 'a' + ('n' if items[0][0].lower() in 'aeiou' else '' ) + ' '
        case _: beforeFirst = f'{str(beforeFirst)} '
    items[0] = beforeFirst + items[0]
    items[-1] = f'{str(beforeLast)} {items[-1]}'
    return ', '.join([i for i in items])

print(f_string('test {a}',{'a':'1'}))

# story = {
#     'a':("Hello!","b"),
#     'b':("Goodbye","a")
# }

# engine().start(story,'a')
