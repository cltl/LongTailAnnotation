import json 
import redis
import pandas as pd
fle = 'data/all'

pool = redis.ConnectionPool(host='localhost', port=6379, db=0)
r = redis.Redis(connection_pool=pool)

allf=pd.read_pickle(fle)

for index, row in allf.iterrows():
    print(index)
    rkey = 'trialinc:%s' % row['incident_uri']
    rval = row.to_json()
    r.set(rkey, json.dumps(rval))
    #r.execute_command('JSON.SET', rkey, '.', json.dumps(row))

