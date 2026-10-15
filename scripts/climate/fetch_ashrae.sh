#!/usr/bin/env bash
# Download ASHRAE 2021 climatic design data for every station in and around NC/SC.
# Usage: bash scripts/climate/fetch_ashrae.sh <work-dir>
# Writes <work-dir>/ashrae/stations.json and <work-dir>/ashrae/params/<wmo>.json,
# plus the US Census 2023 county Gazetteer to <work-dir>/gaz/.
set -euo pipefail
work="${1:?usage: fetch_ashrae.sh <work-dir>}"
api="https://ashrae-meteo.info/v3.0"
mkdir -p "$work/ashrae/places" "$work/ashrae/params" "$work/gaz"

# The station search returns the ~10 nearest stations to a point, so sweep a grid.
for lat in 32.0 32.6 33.2 33.8 34.4 35.0 35.6 36.2 36.6; do
  for lon in -84.3 -83.6 -82.9 -82.2 -81.5 -80.8 -80.1 -79.4 -78.7 -78.0 -77.3 -76.6 -75.9; do
    curl -s -m 30 -X POST "$api/request_places.php" \
      -d "lat=$lat&long=$lon&number=10&ashrae_version=2021" > "$work/ashrae/places/${lat}_${lon}.json"
    sleep 0.2
  done
done

python -I - "$work" <<'EOF'
import glob, json, sys
work = sys.argv[1]
stations = {}
for f in glob.glob(f'{work}/ashrae/places/*.json'):
    for s in json.load(open(f, encoding='utf-8-sig'))['meteo_stations']:
        stations[s['wmo']] = s
json.dump(stations, open(f'{work}/ashrae/stations.json', 'w'))
open(f'{work}/ashrae/wmos.txt', 'w', newline='\n').write('\n'.join(stations) + '\n')
print(len(stations), 'stations')
EOF

while read -r wmo; do
  [ -z "$wmo" ] && continue
  curl -s -m 30 -X POST "$api/request_meteo_parametres.php" \
    -d "wmo=$wmo&ashrae_version=2021&si_ip=IP" > "$work/ashrae/params/$wmo.json"
  sleep 0.15
done < "$work/ashrae/wmos.txt"

curl -s -m 60 -o "$work/gaz/counties.zip" \
  "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_counties_national.zip"
python -I -c "import zipfile,sys; zipfile.ZipFile(sys.argv[1]+'/gaz/counties.zip').extractall(sys.argv[1]+'/gaz')" "$work"
