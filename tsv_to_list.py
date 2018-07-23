mwu_file='mwus.tsv'
patterns_file = 'patterns.tsv'
full_words_file = 'full_words.tsv'

for f in [full_words_file, patterns_file, mwu_file]:
    with open(f, 'r') as myfile:
        a_list = []
        for line in myfile:
            a_list.append(line.strip())
    print(a_list)
