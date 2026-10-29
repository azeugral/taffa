"""Gera as imagens e os JSONs do site a partir de _ref/ig (posts), _ref/hl (destaques) e _ref/pin (pasta
"Disponíveis" do Pinterest). Uso, a partir da pasta do projeto: python site/tools/processar.py"""
import json, os, re
from PIL import Image, ImageOps

AQUI = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(AQUI)
REF = os.path.join(SITE, '..', '_ref'); A = os.path.join(SITE, 'assets', 'img')
for d in ('obras', 'flash', 'hero'): os.makedirs(f'{A}/{d}', exist_ok=True)
DADOS = json.load(open(f'{REF}/ig/dados.json', encoding='utf-8'))

def recorte(src, dst, w, h, dy=.5, q=82):
    im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
    im = ImageOps.fit(im, (w, h), Image.LANCZOS, centering=(.5, dy))
    im.save(dst, 'WEBP', quality=q, method=6)

# (post, categoria, título, fotos do post, desvio vertical do recorte 0..1)
# categorias: bichos, dragoes, ornamento, cor (vermelho e azul)
OBRAS = [
 ('015','ornamento','Braço inteiro em ornamento',['2','1','3','4','5'],.4),
 ('112','cor','Louva-a-deus em vermelho',['1','3','4'],.45),
 ('012','dragoes','Dragões no peito',['1','7'],.5),
 ('070','ornamento','Peito simétrico',['1'],.45),
 ('105','cor','Coluna em azul',['1'],.35),
 ('047','ornamento','Antebraço em preto chapado',['1','2','3','4'],.5),
 ('032','dragoes','Dragão na costela',['1','2'],.5),
 ('008','bichos','Tatu na costela',['1'],.5),
 ('097','cor','Antebraço em vermelho',['1','4'],.5),
 ('010','ornamento','Perna em ornamento',['1','2','3','5'],.4),
 ('111','bichos','Tubarão na barriga',['1'],.5),
 ('068','cor','Braço em azul',['1'],.4),
 ('028','ornamento','Freehand na perna',['1','3'],.45),
 ('113','dragoes','Dragão e sol',['1'],.5),
 ('105','cor','Lagarto em azul',['2'],.5),
 ('053','ornamento','Arm suit',['1','2'],.5),
 ('127','bichos','Peixes',['1','2','4','7'],.5),
 ('054','cor','Pescoço em vermelho',['1'],.4),
 ('021','bichos','Bicho terrível na barriga',['7'],.5),
 ('116','bichos','Libélula',['1'],.5),
 ('057','cor','Mão e braço em vermelho',['1','2'],.45),
 ('085','ornamento','Freehand no braço',['1','2','3'],.45),
 ('028','dragoes','Dragão cicatrizado',['2','9'],.5),
 ('090','bichos','Sapo',['1','2'],.5),
 ('058','cor','Estrelas no freehand',['1','3','4'],.5),
 ('129','ornamento','Antebraço e braço',['1','3'],.45),
 ('091','bichos','Cavalos',['1','2'],.5),
 ('103','cor','Ornamento preto e vermelho',['1','7'],.45),
 ('073','ornamento','Cobertura na coxa',['1','2','3'],.45),
 ('121','bichos','Cobra e vaso',['1'],.5),
 ('105','bichos','Cigarra',['9'],.5),
 ('050','cor','Cavalo em azul',['1'],.45),
 ('076','bichos','Três flashs nas costas',['1','2','3'],.4),
 ('186','dragoes','Dragão inspirado no Haku',['1'],.45),
 ('088','bichos','Sapo na nuvem',['1'],.5),
 ('163','cor','Lagarto em azul e vermelho',['1'],.5),
 ('065','ornamento','Flor sobre tattoo antiga',['1','2'],.5),
 ('142','bichos','Dragão-marinho-folhado',['1'],.5),
 ('148','cor','Cavalo e pássaro em cor',['1'],.45),
 ('167','bichos','Tigres nas costas',['1'],.45),
 ('196','dragoes','Ouroboros em vermelho',['1'],.5),
 ('156','bichos','Tamanduá',['1'],.5),
 ('227','cor','Jacaré em azul',['1'],.5),
 ('169','bichos','Lobo-guará',['1'],.5),
 ('143','bichos','Acari',['1'],.5),
 ('230','cor','Borboleta em azul',['1'],.5),
 ('212','dragoes','Dragão nas costas',['1'],.45),
 ('154','bichos','Mariposa',['1'],.5),
 ('233','cor','Peito em vermelho',['1'],.45),
 ('157','dragoes','Hipogrifo',['1'],.5),
 ('093','bichos','Cachorro do flash day',['1','4'],.5),
 ('202','bichos','Besouro',['1'],.5),
]
obras = []
for i, (p, cat, tit, fotos, dy) in enumerate(OBRAS, 1):
    oid = f'{i:02d}'; nomes = []
    fotos = [f for f in fotos if os.path.exists(f'{REF}/ig/{p}-{f}.jpg')]
    for j, f in enumerate(fotos):
        nome = oid if j == 0 else f'{oid}-{j + 1}'
        recorte(f'{REF}/ig/{p}-{f}.jpg', f'{A}/obras/{nome}.webp', 720, 900, dy if j == 0 else .5)
        nomes.append(nome)
    obras.append({'id': oid, 'cat': cat, 'titulo': tit, 'ig': DADOS[p]['code'], 'fotos': nomes})
json.dump(obras, open(f'{SITE}/assets/obras.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)

# hero: cinco trabalhos que passam sozinhos (preto, vermelho, azul)
for k, (p, f, dy) in enumerate([('015','2',.4), ('112','1',.45), ('070','1',.45), ('105','1',.35), ('012','1',.5)], 1):
    recorte(f'{REF}/ig/{p}-{f}.jpg', f'{A}/hero/{k}.webp', 900, 1125, dy, q=84)

recorte(f'{REF}/ig/059-1.jpg', f'{A}/taffa.webp', 720, 900, .4)

# disponíveis: só o que a pasta do Pinterest marca como disponível (nada de "indisp" ou "reserv")
pins = json.load(open(f'{REF}/pin/pins.json', encoding='utf-8'))
def serie(n, t):
    if n <= 26: return 'terriveis'
    if 'C00L KIDS' in t: return 'coolkids'
    if 'Merian' in t: return 'merian'
    return 'outros'
NOMES = {'terriveis': 'Desenhos terríveis, 2026', 'outros': 'Bichos e dragões', 'merian': 'Bestiário de Merian', 'coolkids': 'Cool kids never die'}
# nome de cada desenho, pela posição na pasta do Pinterest (títulos de lá são só "disp.")
NOME = {1: 'Dragão terrível I', 2: 'Dragão terrível II', 3: 'Ornamento espelhado', 4: 'Bornéu e micro bichos I', 5: 'Bornéu e micro bichos II',
 6: 'Bornéu e micro bichos III', 7: 'Bornéu e micro bichos IV', 8: 'Bornéu e micro bichos V', 10: 'Peixasso', 11: 'Ornamentos marinhos',
 12: 'Patos amarelos I', 13: 'Peixe', 14: 'Peixe tropical', 15: 'Dragão terrível e feio', 17: 'Arm suit em espiral', 18: 'Arm suit',
 19: 'Diva predadora absoluta', 20: 'Patos amarelos II', 21: 'Sapo', 22: 'Arm suit de Bornéu', 23: 'Te amo sapos', 24: 'Patos amarelos III',
 25: 'Peixes e escorpiões', 26: 'Nepenthes', 27: 'Cão', 68: 'Tubarões', 76: 'Ânfora, cobra e yin-yang', 78: 'Mão e yin-yang',
 92: 'Borboleta cybertribal', 93: 'Lagartos', 95: 'Dragões'}
NOME.update({n: f'Bestiário de Merian {r}' for n, r in zip((70, 71, 72, 75), ('I', 'II', 'III', 'IV'))})
disp = []
for n, pn in enumerate(pins, 1):
    t, d = pn['t'], pn['d']; txt = (t + ' ' + d).lower()
    if re.search(r'indisp|reserv', txt) or not re.search(r'disp', txt): continue
    s = serie(n, t)
    fid = f'{len(disp) + 1:02d}'
    src = f"{REF}/pin/{pn['file']}"
    im = Image.open(src).convert('RGBA'); fundo = Image.new('RGBA', im.size, (255, 255, 255, 255)); im = Image.alpha_composite(fundo, im).convert('RGB')
    # miniatura 2:3 (as folhas de 9:16 entram inteiras, centradas no papel branco)
    th = ImageOps.pad(im, (600, 900), Image.LANCZOS, color=(255, 255, 255))
    th.save(f'{A}/flash/{fid}.webp', 'WEBP', quality=84, method=6)
    g = im.copy(); g.thumbnail((1080, 1620), Image.LANCZOS); g.save(f'{A}/flash/{fid}-g.webp', 'WEBP', quality=86, method=6)
    nome = NOME.get(n) or f"Cool kids {sum(x['serie'] == 'coolkids' for x in disp) + 1:02d}"
    disp.append({'id': fid, 'serie': s, 'nome': nome[:60], 'pin': pn['id']})
json.dump({'series': NOMES, 'flash': disp}, open(f'{SITE}/assets/disponiveis.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(len(obras), 'obras;', len(disp), 'disponíveis:', {s: sum(1 for x in disp if x['serie'] == s) for s in NOMES})
