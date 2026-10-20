"""Gera og.jpg (1200x630) com Playwright/Edge: fumaça, assinatura e duas fotos. Uso: python site/tools/og.py"""
import os, pathlib
from playwright.sync_api import sync_playwright
B = pathlib.Path(__file__).resolve().parent.parent
logo = (B/'assets/img/logo.svg').read_text()
u = lambda p: (B/p).as_uri()
og = f"""<body style="margin:0;width:1200px;height:630px;background:#0b0b0c url({u('assets/img/fumaca.webp')}) 70% center/cover;color:#ece8df;font-family:'JetBrains Mono',monospace;position:relative;overflow:hidden">
<div style="position:absolute;inset:0;background:radial-gradient(ellipse 45% 62% at 30% 50%,rgba(11,11,12,.85),rgba(11,11,12,.1))"></div>
<img src="{u('assets/img/hero/1.webp')}" style="position:absolute;right:300px;top:70px;width:250px;height:312px;object-fit:cover;outline:1px solid #ece8df;outline-offset:6px">
<img src="{u('assets/img/hero/2.webp')}" style="position:absolute;right:40px;top:248px;width:250px;height:312px;object-fit:cover;outline:1px solid #ece8df;outline-offset:6px">
<div style="position:absolute;left:70px;top:0;width:520px;height:630px;display:flex;flex-direction:column;justify-content:center;gap:30px">
<div style="width:470px;color:#ece8df">{logo}</div>
<div style="font-size:21px;letter-spacing:.12em;text-transform:uppercase">Bichos · dragões · ornamentos</div>
<div style="font-size:17px;letter-spacing:.12em;text-transform:uppercase;display:flex;gap:14px;align-items:center"><i style="width:10px;height:10px;background:#0c0c0d;outline:1px solid #9b968c"></i><i style="width:10px;height:10px;background:#c1121c"></i><i style="width:10px;height:10px;background:#1d40d2"></i><span style="color:#ef3340">Agenda aberta em SP</span></div></div></body>"""
with sync_playwright() as p:
    br = p.chromium.launch(channel='msedge'); pg = br.new_page(viewport={'width':1200,'height':630})
    tmp = B/'tools/_og.html'; tmp.write_text(og, encoding='utf8'); pg.goto(tmp.as_uri()); pg.wait_for_timeout(800); tmp.unlink(); pg.screenshot(path=str(B/'og.jpg'), type='jpeg', quality=82)
    br.close()
print('ok', os.path.getsize(B/'og.jpg')//1024, 'KB')
