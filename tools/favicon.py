"""Favicon e apple-touch-icon a partir do avatar do Linktree (_ref/avatar.jpg, o tubarão tribal),
no papel do site. Uso: python site/tools/favicon.py"""
import os
from PIL import Image, ImageOps
AQUI = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(AQUI)
im = Image.open(os.path.join(SITE, '..', '_ref', 'avatar.jpg')).convert('L')
x0, y0, x1, y1 = ImageOps.invert(im).point(lambda v: 255 if v > 40 else 0).getbbox()
lado = int(max(x1 - x0, y1 - y0) * 1.08); cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
quad = Image.new('L', (lado, lado), 255); quad.paste(im.crop((cx - lado // 2, cy - lado // 2, cx + lado // 2, cy + lado // 2)), (0, 0))
papel = Image.new('RGB', quad.size, (242, 239, 232)); tinta = Image.new('RGB', quad.size, (12, 12, 13))
rgb = Image.composite(papel, tinta, quad)
for nome, tam in [('favicon-64.png', 64), ('apple-touch-icon.png', 180), ('favicon-32.png', 32)]:
    rgb.resize((tam, tam), Image.LANCZOS).save(os.path.join(SITE, nome), optimize=True)
print('ok', quad.size)
