"""Favicon e apple-touch-icon: o T da logo do Taffa (a peça mais à esquerda de _ref/logo-cliente.webp),
em tinta clara sobre o fundo escuro do site. Uso: python site/tools/favicon.py"""
import os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
AQUI = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(AQUI)
im = Image.open(os.path.join(SITE, '..', '_ref', 'logo-cliente.webp')).convert('RGBA')
im = Image.alpha_composite(Image.new('RGBA', im.size, (255, 255, 255, 255)), im).convert('L')
a = np.array(im) < 128
rot, _ = ndimage.label(a); ys, xs = np.where(a)
t = rot == rot[ys[xs.argmin()], xs.min()]
cobertura = Image.fromarray(np.where(t, 255 - np.array(im), 0).astype('uint8'))   # mantém o antialias da borda
ys, xs = np.where(t); x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
cob = cobertura.crop((x0, y0, x1, y1))
for nome, tam, margem in [('favicon-32.png', 32, .06), ('favicon-64.png', 64, .08), ('apple-touch-icon.png', 180, .16)]:
    lado = int(max(cob.size) * (1 + 2 * margem))
    quad = Image.new('L', (lado, lado), 0); quad.paste(cob, ((lado - cob.width) // 2, (lado - cob.height) // 2 + int(lado * .02)))
    m = quad.resize((tam * 4, tam * 4), Image.LANCZOS)
    if tam <= 32: m = m.filter(ImageFilter.MaxFilter(3))          # engrossa um pouco o traço para não sumir em 32 px
    m = m.resize((tam, tam), Image.LANCZOS)
    papel = Image.new('RGB', (tam, tam), (11, 11, 12)); tinta = Image.new('RGB', (tam, tam), (236, 232, 223))
    Image.composite(tinta, papel, m).save(os.path.join(SITE, nome), optimize=True)
print('ok', cob.size)
