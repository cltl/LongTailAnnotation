import json
import redis
import pickle
import sys
from collections import defaultdict

all_data_file="/home/filten/LongTailQATask/EventRegistries/FireRescue1/firerescue_structured_data.json"

pool = redis.ConnectionPool(host='localhost', port=6379, db=0)
r = redis.Redis(connection_pool=pool)

with open(all_data_file, "r") as f:
    all_data=json.load(f)
    print(len(all_data))
    for k,v in all_data.items():
        rkey = "incinitstr:%s" % k
        rval = json.dumps(v)
        r.set(rkey, rval)
