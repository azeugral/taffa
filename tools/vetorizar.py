"""Vetoriza a logo "Taffa" enviada pelo cliente (_ref/logo-cliente.webp, 2000 px) -> logo.svg, e separa o T
(a primeira peça conectada da assinatura) -> t.svg, usado no favicon.
Uso, a partir da pasta do projeto: python site/tools/vetorizar.py"""
import numpy as np, potrace
from PIL import Image, ImageFilter
from scipy import ndimage

def tinta(src, escala=2, limiar=128, blur=1.2):
    im = Image.open(src).convert('RGBA'); fundo = Image.new('RGBA', im.size, (255, 255, 255, 255))
    im = Image.alpha_composite(fundo, im).convert('L')
    im = im.resize((im.width * escala, im.height * escala), Image.LANCZOS).filter(ImageFilter.GaussianBlur(blur))
    return np.array(im) < limiar                     # tinta = True

def svg(a, dst):
    path = potrace.Bitmap(~a).trace(turdsize=40, alphamax=1.0, opticurve=True, opttolerance=0.2)  # o potracer traça o False
    ys, xs = np.where(a); pad = 6
    x0, y0, x1, y1 = xs.min() - pad, ys.min() - pad, xs.max() + pad, ys.max() + pad
    parts = []
    for c in path:
        s = c.start_point; d = [f'M{s.x-x0:.1f} {s.y-y0:.1f}']
        for seg in c.segments:
            if seg.is_corner: d.append(f'L{seg.c.x-x0:.1f} {seg.c.y-y0:.1f}L{seg.end_point.x-x0:.1f} {seg.end_point.y-y0:.1f}')
            else: d.append(f'C{seg.c1.x-x0:.1f} {seg.c1.y-y0:.1f} {seg.c2.x-x0:.1f} {seg.c2.y-y0:.1f} {seg.end_point.x-x0:.1f} {seg.end_point.y-y0:.1f}')
        parts.append(''.join(d) + 'Z')
    open(dst, 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {x1-x0} {y1-y0}"><path fill="currentColor" fill-rule="evenodd" d="{"".join(parts)}"/></svg>')
    print(dst, len(parts), 'contornos', x1 - x0, y1 - y0)

a = tinta('_ref/logo-cliente.webp')
svg(a, 'site/assets/img/logo.svg')
# o T: a peça conectada que passa pelo meio da barra de cima
rot, n = ndimage.label(a)
ys, xs = np.where(rot > 0)
esq = rot[ys[xs.argmin()], xs.min()]               # a peça mais à esquerda é o T
svg(rot == esq, 'site/assets/img/t.svg')
