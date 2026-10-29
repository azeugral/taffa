"""Vitrine da loja (Espelhos no Fim do Mundo, Nuvemshop): lê _ref/loja/loja.json (gerado por tools/loja.py),
baixa as duas primeiras fotos de cada peça em estoque e gera assets/img/loja/<slug>-1.webp e -2.webp (600x800)
e assets/loja.json. Os projetos "Para pele" ficam de fora: eles já aparecem nos Disponíveis.
Uso, a partir da pasta do projeto: python -I site/tools/processar_loja.py"""
import io, json, os, re, urllib.request
from PIL import Image, ImageOps

AQUI = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(AQUI)
REF = os.path.join(SITE, '..', '_ref', 'loja'); DST = os.path.join(SITE, 'assets', 'img', 'loja')
os.makedirs(DST, exist_ok=True)

# os nomes da loja vêm com "�" gravado no lugar dos acentos; aqui ficam como deveriam ser
NOMES = {
 'acho-que-sao-correntes-de-retorno': 'Acho que são correntes de retorno',
 'caixa-espelhada-n-1': 'Caixa espelhada n.º 1',
 'caixa-espelhada-n-2': 'Caixa espelhada n.º 2',
 'espelho-de-bolso-2': 'Espelho de bolso n.º 2',
 'espelho-de-bolso-redondo': 'Espelho de bolso redondo',
 'pileque-de-vidro-dor-de-dente-n-11': 'Dor de dente, n.º 11',
 'pileque-de-vidro-dragao-n-1': 'Dragão, n.º 1',
 'pileque-de-vidro-equilibrio-n-7': 'Equilíbrio, n.º 7',
 'pileque-de-vidro-iconofossil-n-6': 'Iconofóssil, n.º 6',
 'pileque-de-vidro-passarasso-n-12-copia-copia1': 'Estado meditativo, n.º 8',
 'pileque-de-vidro-passarasso-n-121': 'Passarasso, n.º 12',
 'pileque-de-vidro-tres-gracas-n-5': 'Três Graças, n.º 5',
}
CATS = {'Pileque de vidro': 'Pileque de vidro', 'Caixas Espelhadas': 'Caixa espelhada', 'Espelhos de bolso': 'Espelho de bolso', 'Espelhos de parede': 'Espelho de parede'}
# ordem da vitrine: uma peça de cada tipo primeiro, depois os pileques
ORDEM = ['caixa-espelhada-n-1', 'pileque-de-vidro-dragao-n-1', 'espelho-de-bolso-redondo', 'acho-que-sao-correntes-de-retorno',
         'pileque-de-vidro-tres-gracas-n-5', 'caixa-espelhada-n-2', 'pileque-de-vidro-passarasso-n-12-copia-copia1', 'espelho-de-bolso-2',
         'pileque-de-vidro-equilibrio-n-7', 'pileque-de-vidro-iconofossil-n-6', 'pileque-de-vidro-dor-de-dente-n-11', 'pileque-de-vidro-passarasso-n-121']

def baixa(u):
    b = urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}), timeout=60).read()
    return ImageOps.exif_transpose(Image.open(io.BytesIO(b))).convert('RGB')

def brl(v): return 'R$ ' + f'{v:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')

dados = {p['slug']: p for p in json.load(open(os.path.join(REF, 'loja.json'), encoding='utf-8'))}
saida = []
for slug in ORDEM:
    p = dados[slug]
    if p.get('estoque') != 'InStock' or not p.get('preco'): continue
    fotos = p['fotos'][:2]
    for i, u in enumerate(fotos, 1):
        ImageOps.fit(baixa(u), (600, 800), Image.LANCZOS, centering=(.5, .5)).save(os.path.join(DST, f'{slug}-{i}.webp'), 'WEBP', quality=84, method=6)
    n, v = p.get('parcelas') or (1, p['preco'])
    saida.append({'slug': slug, 'nome': NOMES[slug], 'cat': CATS.get(p['categoria'].strip(), p['categoria'].strip()), 'url': p['url'],
                  'preco': brl(p['preco']), 'parcelas': f'{n}x de {brl(v)} sem juros' if n > 1 else '', 'fotos': len(fotos)})
    print(f"{saida[-1]['cat']:18} {saida[-1]['preco']:>10}  {saida[-1]['nome']}")
json.dump(saida, open(os.path.join(SITE, 'assets', 'loja.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(len(saida), 'peças na vitrine')
