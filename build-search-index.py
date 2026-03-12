#!/usr/bin/env python3
"""Generates search-index.json from content markdown files for the search page.
Run as part of build: python build-search-index.py
Output goes to static/search-index.json so Hugo copies it to public/
"""
import os, re, json

CONTENT_DIR = "content"
OUTPUT = "static/search-index.json"

SERIES_DIRS = ["ai-history", "robotics", "internet-history"]

def parse_frontmatter(text):
    m = re.match(r'^---\n([\s\S]*?)\n---', text)
    if not m: return {}, text
    meta = {}
    for line in m.group(1).split('\n'):
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
    text = re.sub(r'-{3,}', '', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

index = []
for series in SERIES_DIRS:
    series_path = os.path.join(CONTENT_DIR, series)
    if not os.path.isdir(series_path): continue
    for fname in sorted(os.listdir(series_path)):
        if not fname.endswith('.md') or fname == '_index.md': continue
        with open(os.path.join(series_path, fname), 'r', encoding='utf-8') as f:
            text = f.read()
        meta, body = parse_frontmatter(text)
        if meta.get('draft'): continue  # skip unpublished
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
with open(OUTPUT, 'w', encoding='utf-8') as f:
    json.dump(index, f, separators=(',', ':'))
print(f"search-index.json: {len(index)} published episodes")
