"""Map every NC/SC county to its nearest ASHRAE 2021 climatic design station.

Inputs (downloaded, treated as data):
  ashrae/stations.json      station list from ashrae-meteo.info v3.0 (ASHRAE 2021)
  ashrae/params/<wmo>.json  per-station design conditions (IP units)
  gaz/2023_Gaz_counties_national.txt  US Census 2023 Gazetteer county internal points
  county_elevation_ft.json  median USGS 3DEP elevation per county (from elev.py)
Output: county_station_map.json
"""
import json, math, os, sys

base = sys.argv[1]
stations = json.load(open(os.path.join(base, 'ashrae/stations.json')))

MARINE = ('PIER', 'MARINA', 'INLET', 'LOOKOUT', 'FOLLY ISLAND', 'OYSTER LANDING', 'BUOY', 'LIGHT')

usable = {}
for wmo, s in stations.items():
    if any(m in s['place'] for m in MARINE):
        continue
    p = json.load(open(os.path.join(base, f'ashrae/params/{wmo}.json'), encoding='utf-8-sig'))['meteo_stations'][0]
    try:
        rec = {
            'wmo': wmo,
            'place': p['place'].replace(', USA', ''),
            'lat': float(p['lat']), 'lon': float(p['long']),
            'elev_ft': float(p['elev']),
            'stdp_psia': float(p['stdp']),
            'period': p['period'],
            'heat99': float(p['heating_DB_99']),
            'heat996': float(p['heating_DB_99.6']),
            'cool1_db': float(p['cooling_DB_MCWB_1_DB']),
            'cool1_mcwb': float(p['cooling_DB_MCWB_1_MCWB']),
            'range': float(p['hottest_month_DB_range']),
        }
    except (KeyError, ValueError):
        continue
    usable[wmo] = rec

def dist_km(a_lat, a_lon, b_lat, b_lon):
    r = 6371.0
    p1, p2 = math.radians(a_lat), math.radians(b_lat)
    dp, dl = p2 - p1, math.radians(b_lon - a_lon)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))

def record_years(period):
    start, end = (int(x) for x in period.split('-'))
    start += 1900 if start > 50 else 2000
    end += 1900 if end > 50 else 2000
    return end - start + 1

# Selection rule: prefer stations with >= 15 years of record, scored by
# distance plus a penalty for elevation mismatch beyond 500 ft (1,000 ft ~ 50 km).
# If the best long-record station is more than 40 km away, a shorter-record
# station may be used when it scores better.
MIN_YEARS = 15
ELEV_KM_PER_FT = 0.05
ELEV_FREE_FT = 500
FALLBACK_KM = 40
long_record = {w: s for w, s in usable.items() if record_years(s['period']) >= MIN_YEARS}
elev_path = os.path.join(base, 'county_elevation_ft.json')
county_elev = json.load(open(elev_path)) if os.path.exists(elev_path) else {}

rows = []
with open(os.path.join(base, 'gaz/2023_Gaz_counties_national.txt'), encoding='utf-8') as f:
    header = f.readline().rstrip().split('\t')
    for line in f:
        c = dict(zip(header, [x.strip() for x in line.rstrip('\n').split('\t')]))
        if c['USPS'] not in ('NC', 'SC'):
            continue
        lat, lon = float(c['INTPTLAT']), float(c['INTPTLONG'])
        county = c['NAME'].replace(' County', '')
        elev = county_elev.get(f"{c['USPS']}|{county}")
        def score(s):
            d = dist_km(lat, lon, s['lat'], s['lon'])
            if elev is None:
                return d
            return d + ELEV_KM_PER_FT * max(0, abs(s['elev_ft'] - elev) - ELEV_FREE_FT)
        best = min(long_record.values(), key=score)
        if dist_km(lat, lon, best['lat'], best['lon']) > FALLBACK_KM:
            best = min(usable.values(), key=score)
        rows.append({
            'state': c['USPS'],
            'county': county,
            'lat': lat, 'lon': lon,
            'county_elev_ft': elev,
            'station': best,
            'dist_km': round(dist_km(lat, lon, best['lat'], best['lon']), 1),
        })

json.dump(rows, open(os.path.join(base, 'county_station_map.json'), 'w'), indent=1)
print(len(usable), 'usable stations;', len(rows), 'counties')
for r in sorted(rows, key=lambda r: -r['dist_km'])[:10]:
    print('farthest:', r['state'], r['county'], r['dist_km'], 'km ->', r['station']['place'])
