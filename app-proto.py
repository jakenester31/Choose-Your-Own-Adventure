# A simple test for the concept
hell = {
    'start': ['Good morning!',['get up','5 more minutes'],['ready1','sleep1']],
    'ready1': ['You get ready for school, ready for monday, and gleefully walk to the bus station and wait.',['sit down','stand','jump in front of a truck'],['pre-bus sit','pre-bus stand','isekai']],
    'ready2': ['You are now late and so you rush, forgetting to put on your hair tie, you run to the bus station and wait',['sit down','stand','sleep'],['pre-bus sit','pre-bus stand','pre-bus sleep']],
    
    'sleep1':['You sleep for 5 more minutes, time to get up.',['get up','5 more minutes!'],['ready2','sleep2']],
    'sleep2': ['You sleep for another 5 minutes, you are going to be late.',['get up','5 MORE MINUTES!!!'],['ready2','sleep3']],
    'sleep3':'You never get up. You think 5 more minutes over and over. You have been in a comma for 10 years, and soon, many more.',
    
    # I don't know if git hub is ok with gory(?) content
}

def run(obj,at):
    # initiate
    current = obj[at]
    if isinstance(current,str):
        print(current)
        return
    # body
    while True:
        while True:
            print()
            res = input(current[0] + ' ' + inputBuilder(current[1]) + ' >> ')
            if res in current[1]: break
        try:
            current = obj[current[2][current[1].index(res)]]
            if isinstance(current,str):
                print(current)
                break
        except KeyError:
            print(f'An Error occurred: "{res}" is an invalid reference')

def inputBuilder(val:list):
    string = '( '
    for i, item in enumerate(val):
        string += item
        if i != len(val) - 1: 
            string += ', '
    return string + ' )'

run(hell,'start')