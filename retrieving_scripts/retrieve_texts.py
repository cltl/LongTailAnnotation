import redis
import json

r=redis.Redis()

users={"marten", "filip"}

out_path = '../../LongTailQATask/QuestionCreation/ref_texts.json'
out_json = {}

for user in users:
    pattern="str:%s:txt:*" % user
    for key in r.scan_iter(pattern):
        inc_id = key.decode('utf-8')
        ref_texts = r.get(key).decode('utf-8')
        out_json[inc_id] = ref_texts

with open(out_path, 'w') as w:
    json.dump(out_json, w)
