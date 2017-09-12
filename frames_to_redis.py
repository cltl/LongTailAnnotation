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


inc2que = build_inc2que()
allf=pd.read_pickle(fle)
for index, row in allf.iterrows():
    incident_id = row['incident_uri']
    if incident_id not in inc2que.keys(): continue
    strkey = 'incstr:%s' % incident_id
    rval = row.to_json()
    r.set(strkey, json.dumps(rval))

    dockey = 'incdoc:%s' % incident_id
    docs=list(row['hashed_ids'].values())
    r.set(dockey, json.dumps(docs))


for k,v in inc2que.items():
    print(k)
    quekey = 'incque:%s' % k
    r.set(quekey, json.dumps(list(v)))
