"""Median ground elevation per county from 5 USGS 3DEP point queries (epqs.nationalmap.gov)."""
import json, sys, os, urllib.request, statistics, concurrent.futures as cf
base = sys.argv[1]
rows = json.load(open(os.path.join(base, 'county_station_map.json')))
def q(lat, lon):
    url = f"https://epqs.nationalmap.gov/v1/json?x={lon:.4f}&y={lat:.4f}&units=Feet&wkid=4326"
    for _ in range(3):
        try:
            with urllib.request.urlopen(url, timeout=30) as r:
                v = json.load(r).get('value')
                if v is not None and float(v) > -100: return float(v)
        except Exception: pass
    return None
out = {}
def county(r):
    pts = [(r['lat']+dy, r['lon']+dx) for dy, dx in [(0,0),(0.06,0),(-0.06,0),(0,0.07),(0,-0.07)]]
    vals = [v for v in (q(*p) for p in pts) if v is not None]
    return f"{r['state']}|{r['county']}", (round(statistics.median(vals)) if vals else None)
with cf.ThreadPoolExecutor(6) as ex:
    for k, v in ex.map(county, rows): out[k] = v
json.dump(out, open(os.path.join(base, 'county_elevation_ft.json'), 'w'), indent=1)
print(sum(v is None for v in out.values()), 'missing;', len(out), 'counties')
print({k: v for k, v in out.items() if k.split('|')[1] in ('Watauga','Yancey','Wake','Charleston','Buncombe','Avery','Macon')})
