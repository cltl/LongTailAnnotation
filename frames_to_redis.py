import json 
import redis
import sys
import pandas as pd
from collections import defaultdict
fle = 'data/all'

pool = redis.ConnectionPool(host='localhost', port=6379, db=0)
r = redis.Redis(connection_pool=pool)

def build_inc2que():
    my_index = defaultdict(set)
    with open('data/answers.json', 'r') as infile:
        answers=json.load(infile)
        for q_id in answers.keys():
            incs = answers[q_id]["answer_docs"].keys()
            for i in incs:
                my_index[i].add(q_id)
    return my_index

def any_empty_names(participants):
    for p in participants:
        if 'Name' not in p or p['Name']=='':
            return True
    return False

inc2que = build_inc2que()
new_inc2que = {}
allf=pd.read_pickle(fle)
bad_docs_num=0
empty_part=0
for index, row in allf.iterrows():
    incident_id = row['incident_uri']
    if incident_id not in inc2que.keys(): continue
    docs=list(row['hashed_ids'].values())
    if len(docs)<2 or len(docs)>4: 
        bad_docs_num+=1
        continue
    if any_empty_names(row['participants']): 
        empty_part+=1
        continue
    new_inc2que[incident_id]=inc2que[incident_id]

    dockey = 'incdoc:%s' % incident_id
    r.set(dockey, json.dumps(docs))

    strkey = 'incstr:%s' % incident_id
    rval = row.to_json()
    r.set(strkey, json.dumps(rval))


print(len(new_inc2que), bad_docs_num, empty_part)
for k,v in new_inc2que.items():
    quekey = 'incque:%s' % k
    r.set(quekey, json.dumps(list(v)))
