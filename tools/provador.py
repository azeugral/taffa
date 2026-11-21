"""Prepara o provador: flashes viram máscaras de tinta (alfa pelo escuro do traço) e o tubarão vira cursor.
Uso: python tools/provador.py  (da pasta site/)"""
import json, os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

AQUI = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(AQUI)
REF = os.path.join(os.path.dirname(SITE), "_ref")
OUT = os.path.join(SITE, "assets", "img", "provador")
os.makedirs(OUT, exist_ok=True)

# ids dos Disponíveis que funcionam soltos no corpo (sem braço 3D nem várias peças na folha)
ESCOLHA = ["01", "02", "03", "09", "12", "13", "14", "17", "19", "21", "24", "26", "25", "29", "30", "31"]
ESCURO, CLARO = 70, 175   # lum <= ESCURO: tinta cheia; >= CLARO: papel (a marca d'água cinza some)

def alfa(img, serie):
    g = np.asarray(img.convert("L"), dtype=np.float32)
    a = np.clip((CLARO - g) / (CLARO - ESCURO), 0, 1)
    h, w = a.shape
    if serie == "terriveis":   # assinatura "Taffa 2026" nos cantos: tira as manchas que ficam só no canto
        lab, n = ndimage.label(a > .15, structure=np.ones((3, 3)))
        for k, sl in enumerate(ndimage.find_objects(lab), 1):
            y0, y1, x0, x1 = sl[0].start / h, sl[0].stop / h, sl[1].start / w, sl[1].stop / w
            if (y1 < .16 and x1 < .40) or (y0 > .82 and x0 > .50):
                a[sl][lab[sl] == k] = 0
        a[: int(h * .07), : int(w * .30)] = 0
    a[a < .06] = 0
    return a

def recorta(a, folga=.04):
    ys, xs = np.nonzero(a > .2)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    p = int(max(y1 - y0, x1 - x0) * folga)
    return a[max(0, y0 - p): y1 + p + 1, max(0, x0 - p): x1 + p + 1]

def salva_mascara(a, nome, lado=900):
    im = Image.fromarray((a * 255).astype(np.uint8), "L")
    im.thumbnail((lado, lado), Image.LANCZOS)
    rgba = Image.new("RGBA", im.size, (0, 0, 0, 0)); rgba.putalpha(im)
    rgba.save(os.path.join(OUT, nome + ".webp"), quality=88, method=6)
    pq = im.copy(); pq.thumbnail((220, 220), Image.LANCZOS)
    r2 = Image.new("RGBA", pq.size, (0, 0, 0, 0)); r2.putalpha(pq)
    r2.save(os.path.join(OUT, nome + "-p.webp"), quality=85, method=6)
    return im.size

disp = json.load(open(os.path.join(SITE, "assets", "disponiveis.json"), encoding="utf-8"))
por_id = {f["id"]: f for f in disp["flash"]}
lista = []
for i in ESCOLHA:
    f = por_id[i]
    src = Image.open(os.path.join(SITE, "assets", "img", "flash", f"{i}-g.webp"))
    a = recorta(alfa(src, f["serie"]))
    w, h = salva_mascara(a, i)
    lista.append({"id": i, "nome": f["nome"], "serie": f["serie"], "r": round(h / w, 4)})
json.dump(lista, open(os.path.join(OUT, "flashes.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# cursor: o flash "TUBARÃO" do Pinterest dele (pin 049), focinho apontando para cima e à esquerda
tub = Image.open(os.path.join(REF, "pin", "049.jpg"))
a = alfa(tub, "outros"); a = recorta(a, .02)
m = Image.fromarray((a * 255).astype(np.uint8), "L")
m = m.rotate(68, resample=Image.BICUBIC, expand=True)        # deitado, focinho à esquerda e um pouco pra cima
bb = m.getbbox(); m = m.crop(bb)
def cursor(cor, nome, lado=50, giro=0):
    mm = m.rotate(giro, resample=Image.BICUBIC, expand=True) if giro else m
    mm = mm.crop(mm.getbbox())
    big = 8
    s = lado * big / max(mm.size)
    mm = mm.resize((max(1, int(mm.width * s)), max(1, int(mm.height * s))), Image.LANCZOS)
    canvas = Image.new("L", (lado * big, lado * big), 0); canvas.paste(mm, (big * 2, (lado * big - mm.height) // 2))
    borda = canvas.filter(ImageFilter.MaxFilter(big * 2 + 1))     # contorno de papel para ler em fundo escuro
    rgba = Image.new("RGBA", canvas.size, (242, 239, 232, 0))
    rgba.putalpha(borda)
    cheio = Image.fromarray((ndimage.binary_fill_holes(np.asarray(canvas) > 60) * 255).astype(np.uint8), "L")
    corpo = Image.new("RGBA", canvas.size, (251, 250, 246, 255)); corpo.putalpha(cheio)
    rgba = Image.alpha_composite(rgba, corpo)
    tinta = Image.new("RGBA", canvas.size, cor + (255,)); tinta.putalpha(canvas)
    rgba = Image.alpha_composite(rgba, tinta)
    rgba = rgba.resize((lado + 4, lado + 4), Image.LANCZOS)
    rgba.save(os.path.join(OUT, nome + ".png"))
    # ponto do clique: primeiro pixel opaco no canto de cima à esquerda (o focinho)
    al = np.asarray(rgba.split()[3]) > 120
    ys, xs = np.nonzero(al); k = np.argmin(xs * 3 + ys)   # o focinho: o ponto mais à esquerda
    return int(xs[k]), int(ys[k])
pontos = {"normal": cursor((12, 12, 13), "tubarao"), "link": cursor((193, 18, 28), "tubarao-link"),
          "morde": cursor((193, 18, 28), "tubarao-morde", giro=-16)}
json.dump(pontos, open(os.path.join(OUT, "cursor.json"), "w"), indent=1)
print(len(lista), "flashes;", pontos)
