"""Vetoriza a assinatura "Taffa 2026" das folhas de flash (Pinterest) -> logo.svg.
Uso, a partir da pasta do projeto: python site/tools/vetorizar.py"""
import sys, numpy as np, potrace
from PIL import Image, ImageFilter
def vet(src, caixa, dst, escala=6, limiar=150, blur=1.6):
    im = Image.open(src).convert('L').crop(caixa)
    im = im.resize((im.width*escala, im.height*escala), Image.LANCZOS).filter(ImageFilter.GaussianBlur(blur))
    a = np.array(im) < limiar          # tinta = True
    bm = potrace.Bitmap(~a)            # o potracer traça o False
    path = bm.trace(turdsize=60, alphamax=1.1, opticurve=True, opttolerance=0.3)
    ys, xs = np.where(a); pad = 2*escala
    x0, y0, x1, y1 = xs.min()-pad, ys.min()-pad, xs.max()+pad, ys.max()+pad
    parts = []
    for c in path:
        s = c.start_point; d = [f'M{s.x-x0:.1f} {s.y-y0:.1f}']
        for seg in c.segments:
            if seg.is_corner: d.append(f'L{seg.c.x-x0:.1f} {seg.c.y-y0:.1f}L{seg.end_point.x-x0:.1f} {seg.end_point.y-y0:.1f}')
            else: d.append(f'C{seg.c1.x-x0:.1f} {seg.c1.y-y0:.1f} {seg.c2.x-x0:.1f} {seg.c2.y-y0:.1f} {seg.end_point.x-x0:.1f} {seg.end_point.y-y0:.1f}')
        parts.append(''.join(d)+'Z')
    open(dst, 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {x1-x0} {y1-y0}"><path fill="currentColor" fill-rule="evenodd" d="{"".join(parts)}"/></svg>')
    print(dst, len(parts), 'contornos', x1-x0, y1-y0)
# só o nome (sem o ano), recortado do canto da folha 001
vet('_ref/pin/001.png', (660, 1320, 1000, 1420), 'site/assets/img/logo.svg')
