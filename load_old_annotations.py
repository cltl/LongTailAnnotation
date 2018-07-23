import json
import redis

users=["areum", "ngan"]
task="men"

pool = redis.ConnectionPool(host='localhost', port=6379, db=0)
r = redis.Redis(connection_pool=pool)

for u in users:
    with open('annotations/ann_%s.json' % u, 'r') as f:
        anns=json.load(f)
        for inc in anns:
            rkey=task + ':' + u + ':ann:' + inc
            r.delete(rkey)
#            rval=json.dumps(anns[inc])
#            r.set(rkey, rval)
