import base64,sys
sp='/tmp/claude-0/-home-claude/b9a872d6-ef66-5c62-87f3-a3b6b0b691ae/scratchpad/'
head=open('head.html').read()
par=open('parser.js').read().split('/* PARSER_START */')[1].split('/* PARSER_END */')[0]
scr=open('script.js').read().replace('/*PARSER*/',par)
src=head+'__LIBS__\n<script>\n'+scr+'</script>\n'
font=base64.b64encode(open(sp+'kr-sub.ttf','rb').read()).decode()
cdn='''<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js"></script>'''
nm=sp+'libs/node_modules/'
files=[nm+'pdfjs-dist/build/pdf.min.js',nm+'pdfjs-dist/build/pdf.worker.min.js',nm+'pdf-lib/dist/pdf-lib.min.js',nm+'@pdf-lib/fontkit/dist/fontkit.umd.min.js']
inl='\n'.join('<script>'+open(f).read().replace('</script','<\\/script')+'</script>' for f in files)
a=src.replace('__FONT_B64__',font)
open('망도노트.html','w').write(a.replace('__LIBS__',cdn))
off=a.replace('__LIBS__',inl)
off='<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}[hidden]{display:none!important}</style></head><body>'+off+'</body></html>'
open('망도노트_오프라인.html','w').write(off)
import os;print(os.path.getsize('망도노트.html'),os.path.getsize('망도노트_오프라인.html'))

# ---------- PWA ----------
import json,shutil,sys
VER=open('VERSION').read().strip()
pw='pwa/'
pwa=a.replace('__LIBS__',inl)
snippet=open('pwa_snippet.js').read().replace('__VER__',VER)
head_extra='<link rel="manifest" href="manifest.webmanifest"><meta name="theme-color" content="#1b2430"><link rel="icon" href="icon-192.png"><link rel="apple-touch-icon" href="icon-192.png"><meta name="mobile-web-app-capable" content="yes">'
pwa='<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'+head_extra+'<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}[hidden]{display:none!important}</style></head><body>'+pwa+snippet+'</body></html>'
open(pw+'index.html','w').write(pwa)
open(pw+'sw.js','w').write(open('sw_template.js').read().replace('__VER__',VER))
open(pw+'version.json','w').write(json.dumps({"version":VER}))
open(pw+'manifest.webmanifest','w').write(json.dumps({"name":"망도노트","short_name":"망도노트","start_url":"./","scope":"./","display":"standalone","orientation":"any","background_color":"#f3f4f2","theme_color":"#1b2430","lang":"ko",
 "icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png"},{"src":"icon-512.png","sizes":"512x512","type":"image/png","purpose":"any maskable"}]},ensure_ascii=False,indent=1))
print('pwa',VER)
