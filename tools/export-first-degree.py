"""Rebuild the first-degree reference library from reviewed rendered snapshots.

Usage: python3 tools/export-first-degree.py SITE_CHECKOUT
The snapshots must exist in SITE_CHECKOUT/.playwright-mcp/first-degree-{desktop,mobile}.json.
"""
import concurrent.futures
import hashlib
import json
import re
import shutil
import subprocess
import sys
import urllib.parse
import urllib.request
from pathlib import Path

repo = Path(__file__).resolve().parents[1]
site = Path(sys.argv[1]).resolve()
root = repo / 'blocks/nodes/first-degree'
shared = root / '_shared'
assets = shared / 'assets'
assets.mkdir(parents=True, exist_ok=True)
commit = sys.argv[2] if len(sys.argv) > 2 else subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=site, text=True).strip()
origin = 'https://daniilterekh-prog.github.io/barn-estate-homepage-clone/'
snapshots = {view: json.loads((site / f'.playwright-mcp/first-degree-{view}.json').read_text()) for view in ('desktop', 'mobile')}
for view in snapshots:
    snapshots[view].extend(json.loads((site / f'.playwright-mcp/first-degree-cards-{view}.json').read_text()))
titles = {'header':'Хэдер hero', 'sticky-nav':'Хэдер после hero', 'hero':'Первый экран и поиск', 'start-sales':'Старты продаж', 'map':'Карта проектов', 'listing':'Фильтры и листинг ЖК / лотов', 'brand-intro':'BARNES Moscow / вводный блок', 'cta-central':'Центральный CTA с экспертом', 'directions':'Направления', 'news':'Новости', 'faq':'Вопросы и ответы', 'cta-bottom':'Нижний CTA', 'footer':'Футер', 'floating-expert':'Плавающий эксперт', 'request-modal':'Попап заявки'}
titles.update({'card-start-sales':'Карточка старта продаж', 'card-project':'Карточка ЖК', 'card-lot':'Карточка лота'})
urls = set()
for rows in snapshots.values():
    for row in rows:
        urls.update(re.findall(r'\bsrc="(https?://[^\"]+)"', row['html']))
css_files = ['source.css', 'ui-kit.css', 'listing-mode.css', 'start-sales-cards.css', 'owner-header.css', 'owner-footer.css', 'brand-filters.css']
css_contents = {}
for file in css_files:
    css = (site / ('shared' if file == 'owner-header.css' else 'kurortnaya') / file).read_text()
    # Copy project-owned CSS dependencies only. Original remote CSS URLs stay remote.
    for match in re.finditer(r'url\(([\"\']?)([^)]+?)\1\)', css):
        value = match[2]
        if not value.startswith(('http', 'data:', '#')):
            urls.add(urllib.parse.urljoin(origin + 'kurortnaya/', value))
    css_contents[file] = css

asset_map = {}
def materialize(url):
    clean = url.replace('&amp;', '&')
    parsed = urllib.parse.urlparse(clean)
    ext = Path(parsed.path).suffix or '.bin'
    name = hashlib.sha256(clean.encode()).hexdigest()[:16] + ext
    target = assets / name
    if not target.exists():
        if clean.startswith(origin):
            local = site / urllib.parse.unquote(clean[len(origin):].split('?')[0])
            if not local.is_file():
                raise FileNotFoundError(local)
            shutil.copyfile(local, target)
        else:
            request = urllib.request.Request(clean, headers={'User-Agent': 'BARNES-reference-export/1.0'})
            with urllib.request.urlopen(request, timeout=45) as response:
                target.write_bytes(response.read())
    return url, name

with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    for url, name in pool.map(materialize, sorted(urls)):
        asset_map[url] = name
(shared / 'asset-manifest.json').write_text(json.dumps(asset_map, ensure_ascii=False, indent=2) + '\n')
for file, css in css_contents.items():
    def rewrite(match):
        quote, value = match[1], match[2]
        absolute = urllib.parse.urljoin(origin + 'kurortnaya/', value)
        if absolute in asset_map:
            return f'url("assets/{asset_map[absolute]}")'
        return match[0]
    (shared / file).write_text(re.sub(r'url\(([\"\']?)([^)]+?)\1\)', rewrite, css))
shutil.copyfile(site / 'kurortnaya/start-sales-cards.js', shared / 'start-sales.js')

def page(id=None):
    prefix = '../_shared/' if id else '_shared/'
    scripts = f'<script type="module" src="{prefix}preview.js"></script>'
    links = ''.join(f'<link rel="stylesheet" href="{prefix}{file}">' for file in css_files + ['library.css'])
    data = f'data-node="{id}"' if id else 'data-assembly="true"'
    return f'<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{titles.get(id,"Узел первой степени / референс")}</title>{links}</head><body class="barnes-header-template"><main class="node-preview" {data}></main>{scripts}</body></html>\n'

blocks = []
for row in snapshots['desktop']:
    id = row['id']
    folder = root / id
    folder.mkdir(exist_ok=True)
    for view in ('desktop', 'mobile'):
        html = next(item['html'] for item in snapshots[view] if item['id'] == id)
        for url, name in asset_map.items():
            html = html.replace(url, f'../_shared/assets/{name}')
        html = re.sub(r'\s(?:on\w+)="[^"]*"', '', html)
        html = re.sub(r'\sdata-start-sales-bound="[^"]*"', '', html)
        if id == 'card-start-sales':
            html = '<section class="catalog-best-offers node-card-preview">' + html + '</section>'
        elif id.startswith('card-'):
            html = '<section class="node-card-preview">' + html + '</section>'
        # Inline preview transforms and widths depend on the captured viewport.
        html = re.sub(r'(<(?:li|ul)[^>]*class="[^"]*splide__[^"]*"[^>]*?)\sstyle="[^"]*"', r'\1', html)
        (folder / ('fragment.html' if view == 'desktop' else 'mobile.html')).write_text(html + '\n')
    (folder / 'styles.css').write_text(''.join(f'@import url("../_shared/{file}");\n' for file in css_files + ['library.css']))
    (folder / 'index.html').write_text(page(id))
    manifest = {'id':f'first-degree-{id}', 'title':titles[id], 'version':'1.0.0', 'source':{'repo':'daniilterekh-prog/barn-estate-homepage-clone','commit':commit,'route':'kurortnaya','selector':row['selector']}, 'entry':'fragment.html','mobileEntry':'mobile.html','preview':'index.html','styles':['styles.css'],'runtime':'../_shared/runtime.js','contract':'../../../../ui-kit/first-degree.md','dependencies':['../_shared/'], 'hooks': {'map':['onMap'], 'listing':['onFilter','onSort'], 'hero':['onFilter','onSearch'], 'header':['onMenu','onSearch']}.get(id, ['onSubmit','onRequest'] if id in ('cta-central','cta-bottom','request-modal','floating-expert') else [])}
    (folder / 'block.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    (folder / 'README.md').write_text(f'# {titles[id]}\n\nЭталон узла первой степени. Источник: `kurortnaya`, commit `{commit}`.\n\n- `fragment.html` — desktop/tablet; `mobile.html` — до 540 px.\n- `index.html` — самостоятельное превью.\n- `styles.css` — подключение общего слоя; копируйте `_shared` вместе с блоком.\n- `block.json` — источник, зависимости и интеграционные callbacks.\n\nИмпортируйте `mountNode` из `../_shared/runtime.js` и передайте URL папки и обработчики. Сохраняйте классы и `data-v-*`: они являются частью экспортированного CSS-контракта. Тексты, изображения, ссылки, телефоны и ID якорей заменяются под новый узел. Полная инструкция: [общий README](../README.md).\n')
    manifest['assembly'] = id != 'request-modal' and not id.startswith('card-')
    manifest['scripts'] = ['../_shared/start-sales.js'] if id == 'start-sales' else []
    (folder / 'block.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    blocks.append(manifest)
(root / 'manifest.json').write_text(json.dumps({'version':'1.0.0','reference':'kurortnaya','sourceCommit':commit,'blocks':blocks}, ensure_ascii=False, indent=2) + '\n')
(root / 'index.html').write_text(page())
(root / 'catalog.html').write_text('<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Блоки узла первой степени</title><body style="font:18px sans-serif;max-width:900px;margin:40px auto;padding:16px"><h1>Узел первой степени</h1><p><a href="index.html">Полная сборка</a> · <a href="README.md">Интеграция</a></p><ol>' + ''.join(f'<li style="margin:16px"><a href="{b["id"].removeprefix("first-degree-")}/index.html">{b["title"]}</a></li>' for b in blocks) + '</ol></body></html>\n')
print(json.dumps({'blocks':len(blocks),'assets':len(asset_map),'sourceCommit':commit}))
# Keep the older, user-facing card paths current, without duplicating media.
for alias, canonical in {'start-sales':'card-start-sales', 'listing-project':'card-project', 'listing-lot':'card-lot'}.items():
    folder = repo / 'blocks/cards' / alias
    source = root / canonical
    prefix = '../../nodes/first-degree/'
    for file in ('fragment.html', 'mobile.html'):
        folder.joinpath(file).write_text(source.joinpath(file).read_text().replace('../_shared/', prefix + '_shared/'))
    folder.joinpath('styles.css').write_text(f'@import url("{prefix}{canonical}/styles.css");\n')
    folder.joinpath('index.html').write_text(source.joinpath('index.html').read_text().replace('../_shared/', prefix + '_shared/'))
    metadata = json.loads(folder.joinpath('block.json').read_text())
    metadata.update(version='1.1.0', source=json.loads(source.joinpath('block.json').read_text())['source'], entry='fragment.html', mobileEntry='mobile.html', preview='index.html', styles=['styles.css'], dependencies=[prefix + '_shared/'], canonical=prefix + canonical + '/block.json')
    metadata.pop('assets', None)
    folder.joinpath('block.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
    folder.joinpath('README.md').write_text(f'# {titles[canonical]}\n\nАктуальный экспорт Курортной, commit `{commit}`.\n\nЭтот прежний путь синхронизирован с [каноническим компонентом]({prefix}{canonical}/README.md). `fragment.html`, `mobile.html` и `index.html` обновляются вместе; изображения и шрифты не дублируются. Копируй `_shared` коллекции узлов первой степени вместе с карточкой. CSS-классы актуального компонента имеют приоритет над историческими `barnes-listing-card`; старые версии доступны в Git-истории. Контракт: [FirstDegreeNode]({prefix}../../../ui-kit/first-degree.md).\n')
measurements = [json.loads((site / f'.playwright-mcp/first-degree-measurements-{w}.json').read_text()) for w in (390,768,1366,1920,2560)]
(repo / 'ui-kit/first-degree-measurements.json').write_text(json.dumps({'sourceCommit':commit,'environment':'Chromium, CSS viewport px, source Kurortnaya rendered page','measurements':measurements},ensure_ascii=False,indent=2)+'\n')
catalog_path = repo / 'blocks/catalog.json'
catalog = json.loads(catalog_path.read_text())
catalog.setdefault('collections', {})['first-degree'] = {'entry':'nodes/first-degree/manifest.json','preview':'nodes/first-degree/catalog.html','blocks':15,'cards':3,'sourceCommit':commit}
catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
