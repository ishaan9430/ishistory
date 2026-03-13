#!/usr/bin/env python3
"""
1. Strips `published: true/false` from all content frontmatter (Hugo doesn't understand it)
2. Generates static/search-index.json for the search page
"""
import os, re, json

CONTENT_DIR = "content"
SERIES_DIRS = ["ai-history", "robotics", "internet-history"]

FM_RE = re.compile(r'^(---\n)([\s\S]*?)\n(---)', re.MULTILINE)

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()
    m = FM_RE.match(text)
    if not m:
        return None, text
    fm = m.group(2)
    # Extract published value before removing it
    pub_match = re.search(r'^published:\s*(true|false)\s*$', fm, re.MULTILINE)
    published = pub_match.group(1) == 'true' if pub_match else True
    # Remove the published field entirely
    fm_clean = re.sub(r'^published:\s*(true|false)\s*\n?', '', fm, flags=re.MULTILINE)
    new_text = m.group(1) + fm_clean.rstrip('\n') + '\n' + m.group(3) + text[m.end():]
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_text)
    return published, new_text

def parse_fm(text):
    m = FM_RE.match(text)
    if not m: return {}, text
    meta = {}
    for line in m.group(2).split('\n'):
        i = line.find(':')
        if i < 0: continue
        k = line[:i].strip()
        v = line[i+1:].strip().strip('"\'')
        if v == 'true': v = True
        elif v == 'false': v = False
        else:
            try: v = int(v)
            except ValueError: pass
        meta[k] = v
    return meta, text[m.end():].strip()

def strip_md(text):
    text = re.sub(r'^#+\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'\*(.+?)\*', r'\1', text)
    text = re.sub(r'`(.+?)`', r'\1', text)
    text = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', text)
    text = re.sub(r'^>\s*', '', text, flags=re.MULTILINE)
    return text.strip()

index = []
for series in SERIES_DIRS:
    series_path = os.path.join(CONTENT_DIR, series)
    if not os.path.isdir(series_path): continue
    for fname in sorted(os.listdir(series_path)):
        if not fname.endswith('.md') or fname == '_index.md': continue
        fpath = os.path.join(series_path, fname)
        published, new_text = fix_file(fpath)
        if not published:
            continue
        meta, body = parse_fm(new_text)
        slug = fname.replace('.md', '')
        index.append({
            'slug': slug,
            'series': series,
            'title': meta.get('title', slug),
            'description': meta.get('description', ''),
            'tag': meta.get('tag', ''),
            'episode_number': meta.get('episode_number', ''),
            'roman': meta.get('roman', ''),
            'published': True,
            'bodyText': strip_md(body)[:2000],
        })

os.makedirs('static', exist_ok=True)
with open('static/search-index.json', 'w', encoding='utf-8') as f:
    json.dump(index, f, separators=(',', ':'))
print(f"search-index.json: {len(index)} published episodes")
