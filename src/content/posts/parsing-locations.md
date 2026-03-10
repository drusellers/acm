---
title: 'Parsing Locations'
published: false
publishedOn: '2026-02-26'
seo: 
  title: 'Parsing Locations'
excerpt:
    title: 'Parsing Locations'
    eyebrow: 'embedded search'
    tease: >
      How do we know when a user wants to search for a geographic area
      when there are so many places in the world.
---


grab the OSM database https://planet.openstreetmap.org/ - now its about 159 GB of compressed data - so let's focus this in. I'm going to just pull down Austin, TX which is 153MB of gzipped data. Which expands into 2.1GB of XML data.

Convert that to [PBF](https://wiki.openstreetmap.org/wiki/PBF_Format) which brings the data size down to 67 megabytes. 

```sh
osmium cat austin.osm.xml -o austin.pbf
```

Now extract the highways and the names

```sh
osmium tags-filter austin.pbf \
  w/highway \
  w/name \
  -o austin.named-highways.pbf

osmium export austin.named-highways.pbf \
  -u type_id \
  --geometry-types=linestring \
  -f geojson \
  -o streets.geojson

jq -r '
  ["id","name","alt_name","official_name","short_name","loc_name","old_name","ref","highway"],
  (.features[] | [
    (.id // ""),
    (.properties.name // ""),
    (.properties.alt_name // ""),
    (.properties.official_name // ""),
    (.properties.short_name // ""),
    (.properties.loc_name // ""),
    (.properties.old_name // ""),
    (.properties.ref // ""),
    (.properties.highway // "")
  ])
  | @tsv
' streets.geojson > street_gazetteer.tsv
```



Ok, with this pipeline we have a nice list of roads. We still need to dedupe the data, and so on. Now generally speaking new roads aren't being added all of the time. New slang, and nicknames are being added and that will be a concern. But this basic idea is sound.

With this data we now need to build up the gazetter to store this data.

index name: gazetteer-street-v1
alias to : gazetteer-street

id: our internal id (a uuid?)
osm_way_id: (the osm id)
name (primary)
aliases[] (alt_name/old_name/official_name/short_name/loc_name split into array)
highway (OSM highway class)
location (geo_shape linestring or geo_point centroid)
bbox (geo_shape envelope or 4 doubles)

The ES query looks like

```json
GET gazetteer-v1/_search
{
  "size": 5,
  "query": {
    "multi_match": {
      "query": "south congress",
      "fields": [
        "name^3",
        "aliases^2"
      ],
      "type": "best_fields",
      "operator": "and"
    }
  }
}
```

Now the trick is to produce the spans.

"ai engineers in south congress austin tx" <- i really want to find "South Congress"
