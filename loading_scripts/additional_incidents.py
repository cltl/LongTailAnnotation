import json 
import redis
import pickle
import sys
from collections import defaultdict
fle = 'data/all'

pool = redis.ConnectionPool(host='localhost', port=6379, db=0)
r = redis.Redis(connection_pool=pool)

def build_inc2que():
    my_index = defaultdict(set)
    subtasks=['1','2','3']
    for s in subtasks:
        with open('../../AnnotatingEntityProfiles/test_data2/%s_answers.json' % s, 'r') as infile:
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

def count_suspects(participants):
    c=0
    for p in participants:
        if p['Type'].strip()=='Subject-Suspect':
            c+=1
    return c

inc_with_docs={'699605': {'a29dd3463b255cfd3f56e2370f7fef71', '2f8b349bdd33aee71d83a1600ba988be', 'dda7bc9109d5b14295fed60f66ed7f7d'}, '448419': {'037f6f377f59e506917c64e1be5d377d', '5bcff31a35663dc26d40b6d618cd37bb', '0abea63a7570be24292c12b9f401da29'}, '384047': {'8da9fe412b05438e3869fc61f4e34238'}, '808303': {'0867f2224cf1abc49034b813a728c9e0'}, '703245': {'e0a2128d9a6ff90f6fccf3f025a4ac65', '91f874f204798efb704c8864f5030b63', '884fcdb0f6dbf1507a66a24d056439e9'}, '595069': {'706eba02905ed68884e6518d1626998e', '6a1d5638928df825086882013b605435', '4855ca6c46569be9ae2d048f0ecfe491', '0f413d308edb52d4ba3730b7b0773022', '79ff748a1351e8a5228163a2ad95b563'}, '596902': {'a0a7b57f0fc50df84833cb79956a53ef'}, '572696': {'5c62aaffbc5c20099d4d965070cc2b89', '5a4213a3132035fde0a72bccf5d8dba9', 'd2d347bf4116aa8e3bc306c18f21e1bf', '8c91af461ea31c37944305368ce3e58e'}, '533821': {'ba76b12ac6d4a8803cc1e634f5e022e4'}, '750833': {'f2b694085da3d4c7a47b9daf84203fc2'}, '744044': {'d04683209256dab4593d21036b7cdbec', 'bb04045425bf331914ac1349c2681778', '68bac46b8749787f3eb1c7e6d5381dcd'}, '714840': {'d7372b3c58537b3b96d9bb8ff3cc77de'}, '650750': {'0f16d4509c30b0cdea5960475761bf0f', 'd528b2268594774f4a95d90d5d9cc026', 'e9aecf4a326678e09d8ffa365e67ccd1', 'f9bbc81b03438b31cc36934ed7656020', 'f60da94821103eebbca9db2323cf0d4d'}, '804189': {'fc46b8756188ddebdce2caed7d0a1b58'}, '804071': {'fc46b8756188ddebdce2caed7d0a1b58'}, '767876': {'348fe0ed34d2d4fda15a45bacf93ff58', 'ea7e715ce2cebfe2150f83a74f7a69a2'}, '755757': {'506cd74a80407bbbb51af11116f41e3a', '6ec29e65feb117051d252f5e19b62b3b'}, '722219': {'a69e999f63986e1bd297ac23737534c4'}, '556438': {'ef9bfdcb5de4fcd8a9aac38f7396d217'}, '796051': {'15a3b0f34b45c2c580fe09d2b438469c'}, '791843': {'11cb644de83ed10360cf4b2d29378df8'}, '784263': {'3292ffbf03698f22e8b903164f17a7d9', 'ff97d96487c7d7c613d6e734ce0a736c'}, '753058': {'e72954d0386cf74d2c381c8a4ad8b1b5'}, '754893': {'87516b7c4754326bd4305a899427f6c9'}, '741314': {'dd553536ae8bd328f013879c6b9a0b01'}, '732572': {'9d8673b61893f98ed4cb2435dae3f64e'}, '735589': {'420cd4ca65c497dae4ceb9f48695b4d1'}, '502850': {'c3749131ccd051f65800e35f1b561519'}, '389279': {'8cde42bde77e1185bfed6042064839ab'}, '558601': {'241a6bbc60db1aef3dee4cb850527908', '72f807c4088df23c1291c37f7a45113d'}, '635289': {'6fcbb320af01437badd303ea568359df', 'a959aa1826ae723f1b77f0216b744794', '63ce2a03e8e7c6ef4c579f498b6ea006', 'dd0a4277fa6488f0d552386ed50fd64c'}, '617512': {'39890c5f9109dcf8e892c4fc6eaa1fd6'}, '494072': {'9dc2674c6fcaa28d905f126afbc9e462'}, '479734': {'8181d7d618c484cf7891ac8f909f3fef'}, '479709': {'29fc766ec54c956c5b8f68e2e3caacce', '329f03de6e9aa5176d5ede16b043f84f', 'ecf7314e0b89f1a131805c127ecdc5da'}, '489061': {'135bd5e53a32bbb73115dd58f68c166e', '3c17b01c421407b50518ff51263bf3c6'}, '481229': {'e658e0046890ea73c5dd4693fec11fbd'}, '491674': {'135bd5e53a32bbb73115dd58f68c166e'}, '262147': {'bba950f7d3539c49d048494cc97eba85'}, '172205': {'643afe783c872c5f8735bfac467db507'}, '156813': {'b0d346aa60a2521f96f1c97f5e073791'}, '152722': {'b0d346aa60a2521f96f1c97f5e073791'}, '122136': {'5fe7ab4f0c3aceb2d451f1314d83b017'}, '113247': {'37e37f14b5a6647c984ba33a86c8d817'}, '113214': {'37e37f14b5a6647c984ba33a86c8d817'}, '97407': {'690aa011f7988e19504c5fa561fbdfa6', '5023fd87fcffa600ce5306da1ae7aa19'}, '409732': {'9897ff64ff1c41541dd9c4bdb3e2026b'}, '398361': {'1922f1d862869cf9e574bbc2fb0cd93c', '83af1cc743327b3f87842b822cd8d5fc', '7429405c22b148cb229efe97f38e948c', '5f06c4f229db23bfb26a472e2ac7a50e', '8ef81490b7d965e94a44face08ae4eca'}, '382413': {'36f480520da711181d307e5e73263527', '2ce23757a6c738d045466a65971ada10', 'b981ac4d5e572eb4dca7f2eb784feb75', '709ffb35ba351efcdf98f0b20a14d748', '5b34ed434625831985ff3fdf4f43847e'}, '317165': {'85a4cb9d3492c9b66fad75b864aaea6f'}, '588835': {'85a4cb9d3492c9b66fad75b864aaea6f'}, '296327': {'c3e55840c60c2548d475e142c5fe1aa7', 'e28533e4c9975c6e808e8742fcdec33b', 'ddeecf001664b8c1374d4d094ea2266b'}, '809499': {'d4f2e96c80988ac2376a33b04532e4d6'}, '803054': {'307e6d7eafafd3b89ceaf99832e82a0b', 'e08ffa2dcd244ff86e2f8bd81ebb776c', '9d9eeb109e8f9b9d6d7a57e7f75f67f8', '6a0e3e46bc25f9ff1588064884b02fcc', '358807b6c7431cfb6a333cf179db319d', '70258ca1396281d7fd9a6ac68b501fc7'}, '751367': {'96163728bb02a60f0b4d3540cfb24616', '62912ea0d371fb74eaf73e2f155cec5b', 'a59a00470489941c2118c20f63ce5211'}, '727759': {'10d6e5d738ec0ef20825b6a810ed6bd6', 'e2e3e3927e3ad87d9f179661496e8f85', '793abae5deda442a5d39ed684dd1cf94', '9eb33069b4a9d1da39f3bf7d3603eb94', 'd2a9c35f8fae974d2451653697d5cda3'}, '625735': {'c1978f11394908e724cd3a69b2a63094', 'ed02da54aa260deb88970bb974b4be66', 'c3b784b6eb3c6f05941522a1bbf19aa2', 'deb28e7a505953b9b529c70ccca45b0b'}, '624046': {'e9c42c8834a4b1cbc3572a28e7ad6bef', 'b74a6973fecf3adb513aa0fbbcf5bffd'}, '588918': {'d28282604f7104eed44ccaaabf26f493'}, '546550': {'c8553fbe0db29f572eca847e9ac87b81', '1915e53b9857133c0f7a32b35752412a', 'fc19de0117d515dea841f27338707e66', 'ef09bb45f732213c1218fc87ff69413d'}, '510769': {'61f0eb314dd1e960cc77e5b2003c5424', 'cd2474f9d6f6468658448b950085e2ff'}}

new_inc2que = {}
bad_docs_num=0
empty_part=0
too_many_part=0
to_save=set()
MAX_PARTICIPANTS=10

with open('../../LongTailQATask/Evaluation/package_test_data/test_data/input/s1/docs.conll', 'r') as my_f:
    my_file=my_f.read()
    with open('rows_to_store.json', 'r') as rows_file:
        rows=json.load(rows_file)
        for str_row in rows:
            row=json.loads(str_row)
            incident_id=row['incident_uri']
            if incident_id not in inc_with_docs.keys(): continue
            quekey = 'incque:%s' % incident_id
            r.set(quekey, json.dumps(['new']))

            if len(row['participants'])>MAX_PARTICIPANTS:
                too_many_part+=1
                print(len(row['participants']), 'too many')
                continue
            if any_empty_names(row['participants']):
                print(row['participants'])
                empty_part+=1
                #continue
#    suspects=count_suspects(row['participants'])
#    if suspects>1:
#        print(incident_id, suspects)

            dockey = 'incdoc:%s' % incident_id
            docs=list(inc_with_docs[incident_id])
            r.set(dockey, json.dumps(docs))
            to_save.add(incident_id)
            strkey = 'incstr:%s' % incident_id
            r.set(strkey, json.dumps(row))

print(bad_docs_num, too_many_part, empty_part, len(to_save))
print(to_save)
