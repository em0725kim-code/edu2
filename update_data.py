"""엑셀 데이터를 갱신합니다: python dashboard/update_data.py (추가 패키지 불필요)."""
from pathlib import Path
import json, zipfile, xml.etree.ElementTree as ET

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent / '프로그램별_재원_2026_2027.xlsx'
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(SOURCE) as z:
    strings = []
    if 'xl/sharedStrings.xml' in z.namelist():
        strings = [''.join(n.itertext()) for n in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si', NS)]
    root = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    records = []
    for row in root.findall('.//s:sheetData/s:row', NS):
        cells = {}
        for c in row.findall('s:c', NS):
            col = ''.join(x for x in c.attrib['r'] if x.isalpha())
            v = c.find('s:v', NS)
            if c.attrib.get('t') == 's': value = strings[int(v.text)] if v is not None else ''
            elif c.attrib.get('t') == 'inlineStr': value = ''.join(c.find('s:is', NS).itertext())
            else: value = v.text if v is not None else ''
            cells[col] = value
        if cells.get('A') not in ('전력운영', '방위력개선', '병무행정'): continue
        a, b = float(cells['E']), float(cells['F'])
        records.append(dict(id=len(records)+1, sector=cells['A'], account=cells.get('B',''),
            category=cells.get('C',''), program=cells.get('D',''), y26=a, y27=b,
            delta=b-a, rate=(b-a)/a if a else None))
assert records and all(isinstance(r['y26'], (int,float)) for r in records)
payload = dict(source=SOURCE.name, unit='억 원', rows=records)
(HERE / 'data.js').write_text('window.BUDGET_DATA = '+json.dumps(payload, ensure_ascii=False, indent=2)+';\n', encoding='utf-8')
print(f'{len(records)}개 항목 갱신 완료 / 2026 합계 {sum(r["y26"] for r in records):,.0f} / 2027 합계 {sum(r["y27"] for r in records):,.0f} 억 원')
