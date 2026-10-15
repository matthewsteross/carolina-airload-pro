# County climate data

`src/data/climateData.ts` is generated. Every county's design temperatures come from one ASHRAE 2021 weather station, chosen by the rules below. To change a number, regenerate it instead of editing the file by hand.

## Where the numbers come from

- **Design conditions:** ASHRAE Handbook - Fundamentals (2021), Chapter 14 climatic design data, from ASHRAE's climatic design conditions tool (https://ashrae-meteo.info/v3.0/, `ashrae_version=2021`, IP units). The app uses the 99% heating dry bulb, the 1% cooling dry bulb and its mean coincident wet bulb, the hottest-month daily range, and the station's standard pressure.
- **County location:** the US Census 2023 Gazetteer internal point for each county.
- **County elevation:** the median of five USGS 3DEP elevation samples around that point (`elev.py`).

## Station selection rules (`build_climate.py`)

1. Skip marine stations (piers, marinas, inlets).
2. Prefer stations with at least 15 years of record.
3. Score each station as distance in km + 0.05 × (elevation difference beyond 500 ft). That makes 1,000 ft of extra elevation mismatch count like 50 km of distance, which matters only in the mountains.
4. If the best long-record station is more than 40 km away, allow a shorter-record station when it scores better.

`county_station_map.json` records the chosen station, its distance and both elevations for every county. In four mountain counties (Haywood, Jackson, Swain, Watauga) much of the land sits more than 800 ft above the chosen station. The app's data-sources panel warns about this for any county more than 800 ft above its station.

`county_climate_zones.json` holds the IECC zone labels from the original app. They are display labels only and are not used in any calculation. Confirm them against the energy code your jurisdiction has adopted.

## Regenerate

```bash
bash scripts/climate/fetch_ashrae.sh /tmp/climate-work
python -I scripts/climate/build_climate.py /tmp/climate-work   # needs county_elevation_ft.json in the work dir
python -I scripts/climate/gen_climate_ts.py scripts/climate src/data/climateData.ts
npm test
```

`build_climate.py` writes `county_station_map.json` into the work directory. Copy it here, along with `county_elevation_ft.json` (from `elev.py`), before running the generator.
