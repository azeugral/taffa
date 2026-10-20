"""Renderiza a fumaça sutil (assets/js/fumaca.js) quadro a quadro num Edge headless e gera
assets/video/fumaca-celular.mp4 (em pé, hero no celular), assets/video/fumaca-deitado.mp4 (chamada final e
tablet deitado) e os pôsteres assets/img/fumaca-m.webp e fumaca.webp. O loop fecha sem emenda (fase 0 → 2π).
Uso: python tools/gerar_video.py [--so-poster]"""
import os, subprocess, base64, io
from playwright.sync_api import sync_playwright
import imageio_ffmpeg
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(AQUI)
VID = os.path.join(SITE, 'assets', 'video'); IMG = os.path.join(SITE, 'assets', 'img')
FPS, SEGUNDOS = 30, 50                      # mesmo ciclo do desktop (2π em 50 s)
# nome, largura, altura, eixo do espelho, pôster, quadro do pôster
VERSOES = [('fumaca-celular', 864, 1872, .5, 'fumaca-m.webp', 0), ('fumaca-deitado', 1920, 1080, .5, None, 0)]

def renderizar(nome, w, h, eixo, poster, qp):
    q = FPS * SEGUNDOS
    mp4 = os.path.join(VID, nome + '.mp4')
    enc = subprocess.Popen([imageio_ffmpeg.get_ffmpeg_exe(), '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', 'png', '-i', '-',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-tune', 'grain', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', '-an', mp4], stdin=subprocess.PIPE)
    with sync_playwright() as p:
        b = p.chromium.launch(channel='msedge', args=['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'])
        pg = b.new_page(viewport={'width': w, 'height': h})
        pg.set_content(f'<body style="margin:0"><canvas id="c" width="{w}" height="{h}"></canvas></body>')
        pg.add_script_tag(path=os.path.join(SITE, 'assets', 'js', 'fumaca.js'))
        pg.evaluate("window.T = fumacaGL(document.getElementById('c'), {preserveDrawingBuffer: true})")
        for i in range(q):
            png = base64.b64decode(pg.evaluate(f"(T.desenhar({i / q * 6.283185307179586}, {eixo}), document.getElementById('c').toDataURL('image/png'))").split(',', 1)[1])
            enc.stdin.write(png)
            if poster and i == qp:
                Image.open(io.BytesIO(png)).convert('RGB').save(os.path.join(IMG, poster), 'WEBP', quality=86)
        b.close()
    enc.stdin.close(); enc.wait()
    print(mp4, round(os.path.getsize(mp4) / 1e6, 2), 'MB')

def poster_desktop():
    """Pôster do desktop (antes do WebGL carregar e na chamada final), com o eixo atrás da foto."""
    with sync_playwright() as p:
        b = p.chromium.launch(channel='msedge', args=['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'])
        pg = b.new_page(viewport={'width': 2560, 'height': 1440})
        pg.set_content('<body style="margin:0"><canvas id="c" width="2560" height="1440"></canvas></body>')
        pg.add_script_tag(path=os.path.join(SITE, 'assets', 'js', 'fumaca.js'))
        pg.evaluate("window.T = fumacaGL(document.getElementById('c'), {preserveDrawingBuffer: true})")
        png = base64.b64decode(pg.evaluate("(T.desenhar(0, .72), document.getElementById('c').toDataURL('image/png'))").split(',', 1)[1])
        Image.open(io.BytesIO(png)).convert('RGB').save(os.path.join(IMG, 'fumaca.webp'), 'WEBP', quality=86)
        b.close()

if __name__ == '__main__':
    import sys
    os.makedirs(VID, exist_ok=True)
    poster_desktop()
    if '--so-poster' not in sys.argv:
        for v in VERSOES: renderizar(*v)
