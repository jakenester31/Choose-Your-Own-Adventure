from typing import Any
import asyncio
import time
import threading

class Singleton:
    _instance = None
    def __new__(cls,*args,**kwargs):
        if not cls._instance:
            cls._instance = super().__new__(cls)
        return cls._instance

class Symbol:
    description:str
    storage:dict[str,Symbol] = {}
    # Initiators
    def __init__(self,description:str = "") -> None:
        self.description = description
    @classmethod
    def unique(cls,uniqueDescription:str):
        if not uniqueDescription in cls.storage:
            cls.storage[uniqueDescription] = cls(uniqueDescription)
        return cls.storage[uniqueDescription]
    # Debug
    def __repr__(self) -> str:
        return f'Symbol("{self.description}")'
    # Hash
    def __hash__(self) -> int:
        return hash(id(self))
    def __eq__(self,other) -> bool:
        return hash(self) == hash(other)

class Symbols:
    storage:dict[str,Symbol] = {}
    def __init__(self,*args:str) -> None:
        self.add(*args)
    def __getattr__(self, name: str) -> Any:
        if name in self.storage:
            return self.storage[name]
        raise AttributeError(f"'{type(self).__name__}' object has no attribute '{name}'")
    def add(self,*args:str) -> None:
        self.storage.update({ i: Symbol(i) for i in args })

class AdventureEngine(Singleton):
    storyline: dict
    symbols: Symbols = Symbols("nulNodeName")
    def __init__(self,storyline:dict):
        self.storyline = storyline
    
    async def main(self):
        while True:
            print("MAIN")
        
    def next(self): # Iterates to the next node
        pass
    
    def play(self,nodeName:str = symbols.nulNodeName): # Turns on auto next node. Optionally specify next node (uses route).
        print(nodeName)
    
    def route(self,nodeName:str): # Sets the next node. Engine side to handle next Node.
        pass
    
    def reroute(self,nodeName:str): # Overwrites the next node. Ignores normal route. User side to handle complex routing logic
        pass

# Route order
# Move to Node
# Call Node before hook (Optional)
# Call Node
# Call Node after hook (Optional)
# route to rerouted Node 
# | route to next Node


# Branch types
# Simple: a -> b
    # A branch that runs and after next is called, routes to next Node directly
# Linear: a.0 -> a.1 -> a.2 -> b
    # A branch containing subbranches that flow like a slideshow
# Option:
    # Optional: a (b,c) -> c
    # Required: {data: 2} a ( b => data == 1, c => data == 2) -> c
        # With requirements for each option to determine the next node
    # A branch that uses an input to determine the next node

# Pseudo types
# Hooked:
    # Before: /a -> b
    # After: a/ -> b
# Rerouted: 
    # Simple: a -> -b- c
    # Linear: a.0 -> a.1 -> a.2 -> -b- c
    # A routes to c instead of b

class Branch:
    pass
class LinearBranch:
    pass

# "display text"
# 

test = {
    "a":Branch()
}

print("START")
engine = AdventureEngine(test)
print("AFTER ENGINE")
engine.play()
time.sleep(3)
engine.pause()