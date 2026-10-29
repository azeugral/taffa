"""Lê a loja Nuvemshop dos Espelhos no Fim do Mundo: categorias, produtos (nome, preço, estoque, fotos)
-> _ref/loja/loja.json. Uso: python -I site/tools/loja.py (a partir da pasta do projeto)"""
import re, json, urllib.request, html, os
BASE = 'https://espelhosnofimdomundo.lojavirtualnuvem.com.br'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '_ref', 'loja')
def get(u):
    r = urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}), timeout=30)
    b = r.read(); cs = r.headers.get_content_charset() or 'utf-8'
    return b.decode(cs, 'replace')
def lds(s):
    for m in re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', s, re.S):
        try: yield json.loads(m)
        except Exception: pass
home = get(BASE + '/')
cats = sorted(set(re.findall(BASE.replace('.', r'\.') + r'/([a-z0-9-]+)/"', home)) - {'produtos', 'contato', 'search', 'account', 'cart', 'checkout', 'comprar'})
print('categorias candidatas:', cats)
links = set()
for pg in range(1, 6):
    s = get(BASE + '/produtos/' + (f'page/{pg}/' if pg > 1 else ''))
    novos = set(re.findall(BASE.replace('.', r'\.') + r'/produtos/([^"/]+)/"', s))
    if not novos - links and pg > 1: break
    links |= novos
print(len(links), 'produtos')
prods = []
for slug in sorted(links):
    s = get(f'{BASE}/produtos/{slug}/')
    p = {'slug': slug, 'url': f'{BASE}/produtos/{slug}/'}
    for d in lds(s):
        if d.get('@type') == 'WebPage' and d.get('mainEntity', {}).get('@type') == 'Product':
            e = d['mainEntity']; o = e.get('offers', {})
            p.update(nome=html.unescape(e['name']), preco=float(o.get('price') or 0), estoque=o.get('availability', '').split('/')[-1])
            bc = [i['name'] for i in d.get('breadcrumb', {}).get('itemListElement', [])]
            p['categoria'] = bc[1] if len(bc) > 2 else ''
    # fotos: só a galeria do próprio produto (os slides js-product-slide, link para a versão 1024)
    fotos = []
    for u in re.findall(r'js-product-slide w-100[^>]*>\s*<a href="(//dcdn-us\.mitiendanube\.com/[^"]+)"', s):
        if 'https:' + u not in fotos: fotos.append('https:' + u)
    p['fotos'] = fotos
    # parcelas sem juros: o maior número de parcelas "without_interests" do Nuvem Pago
    sem = [(int(n), float(v)) for n, v, w in re.findall(r'\\"(\d+)\\":\{\\"installment_value\\":([\d.]+),[^}]*?\\"without_interests\\":(true)', s)]
    if sem: p['parcelas'] = max(sem)
    # preço promocional / parcelas, quando houver
    m = re.search(r'data-product-price="(\d+)"', s)
    if m and not p.get('preco'): p['preco'] = int(m.group(1)) / 100
    prods.append(p)
    print(f"{p.get('categoria','?'):18} {p.get('preco',0):8.2f} {p.get('estoque',''):11} {len(fotos)} {p.get('nome','?')}")
json.dump(prods, open(os.path.join(OUT, 'loja.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
