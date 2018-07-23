from collections import defaultdict
import spacy_to_naf
import json
from spacy.en import English

def get_duplicate_sents(doc, threshold, verbose=False):
    """
    get sentence identifiers of sentences
    which occur more than threshold in the text

    :param lxml.etree._Element doc: parsed NAF

    :rtype: set
    :return: set of sentence identifiers to ignore
    """
    sent_ids_to_ignore = set()

    sent_id2sent_tokens = defaultdict(list)
    for wf_el in doc.iterfind('text/wf'):
        sent_id = wf_el.get('sent')
        sent_id2sent_tokens[sent_id].append(wf_el.text)

    sent2sent_ids = defaultdict(set)
    for sent_id, tokens in sent_id2sent_tokens.items():
        sent = ' '.join(tokens)
        sent2sent_ids[sent].add(sent_id)

    for sent, sent_ids in sent2sent_ids.items():
        freq = len(sent_ids)
        if freq >= threshold:
            sent_ids_to_ignore.update(sent_ids)
            if verbose:
                print('ignored with freq %s: %s' % (freq, sent))

    return sent_ids_to_ignore

def text2conll_one_file(nlp, incident_uri, doc_id, discourse, text, pre=False):
    """
    use spacy to output text (tokenized) in conll

    :param str doc_id: document identifier
    :param str discourse: TITLE | BODY
    :param str text: content (either title or context of news article)
    """
    doc = spacy_to_naf.text_to_NAF(text, nlp)

    
    sent_ids2ignore = get_duplicate_sents(doc, threshold=3, verbose=True)
    output = []
    num_chars = 0
    prev_sent_id = 1
    token_id = 0
    unique_ids = defaultdict(int)

    for wf_el in doc.xpath('text/wf'):
        sent_id = wf_el.get('sent')

        if sent_id in sent_ids2ignore:
            continue

        if prev_sent_id != int(sent_id):
            token_id = 0
        elif prev_sent_id == int(sent_id):
            token_id += 1

        prev_sent_id = int(sent_id)

        if discourse == 'BODY':
            id_ = '{doc_id}.b{sent_id}.{token_id}'.format_map(locals())
        if discourse == 'TITLE':
            id_ = '{doc_id}.t{sent_id}.{token_id}'.format_map(locals())

        unique_ids[id_] += 1

        if pre:
            info = [id_, wf_el.get('offset'), wf_el.get('length')]
            output.append('\t'.join(info) + '\n')
        else:
            num_chars += len(wf_el.text)
            info = [id_, wf_el.text, discourse, '-']
            output.append('\t'.join(info) + '\n')

    for id_, freq in unique_ids.items():
        if freq >= 2:
            raise AssertionError('id %s occurs %s times' % (id_, freq))

    return output, num_chars

def pretokenize(row):
    """
    pretokenize news articles using spacy
    and convert to conll

    :param pandas.core.frame.DataFrame df: gva archive
    :param dict settings: dict with settings about:
    {'accepted_char_range' : range(300, 4000),$
     'date_range' : (date(2013, 1, 1), date(2016, 12, 31),$
     'accepted_years' : ['2013', '2014', '2015', '2016']$
     }
     :param set disqualified_docs: set of doc_ids to ignore

    :rtype: dict
    :return: source_url -> list of strings (conll output)
    """
    gv_news_article_template = 'the_violent_corpus/{incident_uri}/{the_hash}.json'
    fr_news_article_template = 'firerescue_corpus/{incident_uri}/{the_hash}.json'
    bu_news_article_template = 'business_corpus/{incident_uri}/{the_hash}.json'

    doc_id2conll = dict()
    not_found = set()
    nlp = English()
    distribution = defaultdict(int)
    dcts = []

    ignored_docs = set()


    num_removed_due_to_length = 0
    rows_to_keep = []
    num_removed = 0


    to_check = False
    the_date = row['date']
    if not the_date:
        return

    if type(the_date) == str:
        year = the_date[-4:]
    elif type(the_date) == dict:
        year = the_date['dt_year']

    to_check = True
    clean_incident_sources = dict()
    for source_url, row_dct in row['incident_sources'].items():

        # create path to newsitem object
        hash_obj = hashlib.md5(source_url.encode())
        the_hash = hash_obj.hexdigest()
        incident_uri = row['incident_uri']

        news_article_template = gv_news_article_template
        if incident_uri.startswith('FR'):
            news_article_template = fr_news_article_template
        if incident_uri.startswith('BU'):
            news_article_template = bu_news_article_template

        path = news_article_template.format_map(locals())

        if source_url in doc_id2conll:
            continue

        # load newsitem object if it exists
        try:
            with open(path, 'rb') as infile:
                news_article_obj = pickle.load(infile)
        except FileNotFoundError:
            print(source_url, 'not found')
            continue

        # tokenize and store conll in list of strings
        conll = []

        # header
        conll.append('#begin document ({the_hash});\n'.format_map(locals()))

        # write dct
        if not news_article_obj.dct:
            continue

    
        info = [the_hash + '.DCT', str(news_article_obj.dct), 'DCT', '-']
        conll.append('\t'.join(info) + '\n')
        dcts.append(news_article_obj.dct)

        # title
        title_conll, title_chars = text2conll_one_file(nlp, incident_uri, the_hash, 'TITLE', news_article_obj.title)
        if not title_conll:
            continue
        conll.extend(title_conll)

        # body
        body_conll, body_length = text2conll_one_file(nlp, incident_uri, the_hash, 'BODY', news_article_obj.content)
        if not body_conll:
            continue

        conll.extend(body_conll)

        if body_length not in accepted_char_range:
            num_removed_due_to_length += 1

        # end
        conll.append('#end document\n')

        # save to naf
        #naf_output_path = os.path.join(args.output_folder, 'naf', incident_uri + '---' + the_hash + '.naf')
        #doc = spacy_to_naf.text_to_NAF(news_article_obj.title + '. ' + news_article_obj.content, nlp)
        #piek(naf_output_path, doc)

        clean_incident_sources[source_url] = row_dct
        doc_id2conll[source_url] = conll

    if to_check:
        if clean_incident_sources:
            df.set_value(index, 'incident_sources', clean_incident_sources)
            rows_to_keep.append(index)
        else:
            num_removed += 1

    print('%s incidents removed during cleanup' % num_removed)
    print('%s incidents remain' % len(rows_to_keep))
    print('dct range: %s %s' % (min(dcts), max(dcts)))
    print()

    #total = sum(distribution.values())
    #for key, value in sorted(distribution.items(),
    #                         key=operator.itemgetter(1),
    #                         reverse=True):
    #    perc = 100 * (value/total)
    #    print(key, value, round(perc, 2))

    return doc_id2conll, df

if __name__=="__main__":
    with open('rows_to_store.json', 'r') as rows_file:
        rows=json.load(rows_file)
        for str_row in rows:
            row=json.loads(str_row)
            pretokenize(row)
            break
