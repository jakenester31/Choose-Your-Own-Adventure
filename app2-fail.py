# This uses python 3.8 and is broken in python 3.13.7
# Either way, it was never finished as I realized that some things could be done better.
backpack = []
items = ['apple','banana','knife','bazooka']
story = {
    'start':[
        'look at table and take...',
        ['take nothing',*items,'nothing'],
        ['end',{'ktt':items},'end'],
        {"after":lambda res: start_delete(res)}
    ],
    
    'end':["Done browsing. You have: $b1",{"b1":lambda e: ', '.join(backpack)}],
    
    'ktt':[
        ['you took a $test',{'test':(lambda res: res)}],
        ['continue','finish'],['start','end'],
        {"before": lambda res: None if res in backpack else backpack.append(res)}
    ], # kitchen table take %
}

def start_delete(res):
    index = story['start'][2]
    print(res,'delete >> ',index)

def run(obj,at):
    # initiate
    current = obj[at]
    if isinstance(current,str):
        print(current)
        return
    res = ''
    # body
    while True:
        while True:   
            if isinstance(current,list) and len(current) > 3 and 'before' in current[3] and callable(current[3]['before']):
                current[3]['before'](res)
                         
            if isinstance(current[0],list):
                res = input(mapTo(*current[0],res) + ' ' + inputBuilder(current[1]) + ' >> ')
            elif isinstance(current[0],str):
                res = input(current[0] + ' ' + inputBuilder(current[1]) + ' >> ')
            else:
                raise Exception('Current branch text is invalid')
            
            if isinstance(current,list) and len(current) > 3 and 'after' in current[3] and callable(current[3]['after']):
                current[3]['after'](res)
            
            if res in current[1]: break
        try:
            item = current[1].index(res)
            count = -1
            
            # for i in current[2]: # I hate this god forsaken noodle code, its an insult to me.
            #     if isinstance(i,dict):
            #         for prop in i:
            #             if (isinstance(i[prop],list)):
            #                 for prop2 in i[prop]:
            #                     if count == item: break
            #                     count += 1
            #                     if count == item: current = obj[prop]
            #             else:
            #                 if count == item: break
            #                 count += 1
            #                 if count == item: current = obj[prop]
            #     else:
            #         if count == item: break
            #         count += 1
            #         if count == item: current = obj[i]
            
            find_match()
            print('index:',item,count)
            
            # if isinstance(current,list) and len(current) > 3 and callable(current[3]['after']):
            #     current[3]['after'](res)
            
            if isinstance(current,str):
                print(current)
                break
            
            if isinstance(current,list) and len(current) == 2 and isinstance(current[1],dict):
                print(mapTo(*current,res))
                break
        except KeyError:
            print(f'An Error occurred: The choice "{res}" references a nonexistent branch')
        # except TypeError:
        #     print(f'An Error occurred: The choice "{res}" connects to an invalid option')

def inputBuilder(val:list):
    string = '( '
    for i, item in enumerate(val):
        string += item
        if i != len(val) - 1: 
            string += ', '
    return string + ' )'


def mapTo(string:str,map:dict,res):
    for i in map:
        if string.find('$' + i) == -1: 
            print(f'Warning: {i} is not an included template')
            continue
        to_insert = map[i]
        if callable(to_insert):
            to_insert = to_insert(res)
        string = string[0 : string.index('$' + i)] + str(to_insert) + string[string.index('$' + i) + len(i) + 1 :]
    return string

def find_match(): ##r currently broken, fix it!!!!
    for i in current[2]: # I hate this god forsaken noodle code, its an insult to me.
        if isinstance(i,dict):
            for prop in i:
                if (isinstance(i[prop],list)):
                    for prop2 in i[prop]:
                        if count == item: break
                        count += 1
                        if count == item: current = obj[prop]
                else:
                    if count == item: break
                    count += 1
                    if count == item: current = obj[prop]
        else:
            if count == item: break
            count += 1
            if count == item: current = obj[i]

run(story,'start')