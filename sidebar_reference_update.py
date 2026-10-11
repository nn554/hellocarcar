from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import base64, io, html

ROOT = Path(__file__).resolve().parent
SOURCES = {
    'zh': Path('C:/Users/34334/AppData/Local/Temp/codex-clipboard-0b7f61d1-1652-4a65-8d0d-00390780af04.png'),
    'en': Path('C:/Users/34334/AppData/Local/Temp/codex-clipboard-aeee8273-9132-4f99-8467-bbee00b93f5c.png'),
}
FONT = 'C:/Windows/Fonts/msyh.ttc'

def data_uri(im):
    stream = io.BytesIO()
    im.save(stream, format='PNG')
    return 'data:image/png;base64,' + base64.b64encode(stream.getvalue()).decode()

for lang, source in SOURCES.items():
    original = Image.open(source).convert('RGB')
    scale = original.width / 2048
    width, height = original.size
    out = original.copy()
    bg = original.getpixel((round(245*scale), round(600*scale)))
    color = '#%02x%02x%02x' % bg
    elements = [f'<image x="0" y="0" width="2048" height="1127" href="{data_uri(original)}"/>']

    def rect(x, y, w, h):
        ImageDraw.Draw(out).rectangle((round(x*scale), round(y*scale), round((x+w)*scale)-1, round((y+h)*scale)-1), fill=bg)
        elements.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{color}"/>')

    def copy(box, x, y, name):
        x0, y0, x1, y1 = box
        crop = original.crop(tuple(round(v*scale) for v in box))
        out.paste(crop, (round(x*scale), round(y*scale)))
        elements.append(f'<g id="{name}"><image x="{x}" y="{y}" width="{x1-x0}" height="{y1-y0}" href="{data_uri(crop)}"/></g>')

    rect(0, 120, 251, 892)
    copy((13,166,239,201),13,128,'Vehicle-quotations')
    copy((13,206,239,241),13,168,'Shipping-quotations')
    copy((13,245,239,280),13,208,'Company-investigation-report')
    # Preserve the existing report icon and selected background, replacing only its label.
    if lang == 'en':
        highlight = original.getpixel((round(235*scale),round(260*scale)))
        ImageDraw.Draw(out).rectangle((round(53*scale),round(210*scale),round(230*scale),round(240*scale)), fill=highlight)
        elements.append('<rect x="53" y="210" width="177" height="30" fill="#%02x%02x%02x"/>' % highlight)
        label = 'Company investigation report'
        size = 12
    else:
        rect(53,210,180,30)
        label = '企业调查报告'
        size = 14
    font = ImageFont.truetype(FONT, round(size*scale))
    ImageDraw.Draw(out).text((round(57*scale),round(216*scale)),label,font=font,fill=(210,235,219))
    elements.append(f'<text x="57" y="229" font-family="Microsoft YaHei, Arial, sans-serif" font-size="{size}" fill="#d2ebdb">{html.escape(label)}</text>')
    copy((13,360,239,397),13,248,'Delivery-disputes')
    copy((13,400,239,436),13,288,'Specification-sheet')
    copy((13,440,239,475),13,328,'Policy-consultation')
    copy((13,484,239,920),13,372,'Recent-conversations')
    copy((13,931,239,972),13,819,'Browse-all-history')
    rect(65,1076,174,21)
    account_label = '我的账户' if lang == 'zh' else 'My account'
    account_font = ImageFont.truetype('C:/Windows/Fonts/msyhbd.ttc', round(13*scale))
    ImageDraw.Draw(out).text((round(69*scale),round(1076*scale)),account_label,font=account_font,fill=(224,240,229))
    elements.append(f'<text x="69" y="1090" font-family="Microsoft YaHei, Arial, sans-serif" font-weight="700" font-size="13" fill="#e0f0e5">{account_label}</text>')
    # Move the existing gear rather than introducing another icon style.
    copy((23,984,46,1008),211,1081,'Account-settings-gear')
    out.save(ROOT / f'hellocarcar-sidebar-reference-{lang}.png')
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{width}" height="{height}" viewBox="0 0 2048 1127">' + ''.join(elements) + '</svg>'
    (ROOT / f'hellocarcar-sidebar-reference-{lang}.svg').write_text(svg,encoding='utf-8')
    print(lang, original.size, 'background',color,'created PNG and SVG')
