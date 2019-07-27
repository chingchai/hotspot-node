const express = require('express');
const router = express.Router();

const request = require('request');
const csv = require('csvtojson');
const turf = require('@turf/turf');

// const http = require('http');
// const request = require('request');

//concr con = require('./conn');
//concr db = con.th;

const Pool = require('pg').Pool
const db = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'omfs',
    password: '1234',
    port: 5432,
});

// geojson extent
const Fs = require('fs');
const prv = JSON.parse(Fs.readFileSync('gis_data/p4.geojson')); // feature collection of polygons
const json = require('./pv4');
const proJson = require('./geojson');
// console.log(proJson);
// ph nn py cr extent
var poly_ph = turf.polygon(json.ph.features[0].geometry.coordinates[0]);
var poly_py = turf.polygon(json.py.features[0].geometry.coordinates[0]);
var poly_nn = turf.polygon(json.nn.features[0].geometry.coordinates[0]);
var poly_cr = turf.polygon(json.cr.features[0].geometry.coordinates[0]);
var pro = turf.polygon(proJson.pro.features[0].geometry.coordinates[0]);
// console.log(json.cr.features[0].geometry.coordinates[0])
var poly = turf.polygon([
    [
        [99.36734051792395, 16.320423380302735],
        [101.19256380509475, 16.320423380302735],
        [101.19256380509475, 18.834396175460839],
        [99.36734051792395, 18.834396175460839],
        [99.36734051792395, 16.320423380302735]
    ]
]);

router.get("/hp_test", (req, res, next) => {
    const urlServer = 'http://119.59.125.191/geolab/hotspot3.csv';
    const urlFirms = 'https://firms.modaps.eosdis.nasa.gov/active_fire/c6/text/MODIS_C6_SouthEast_Asia_7d.csv';
    csv().fromStream(request.get(urlServer)).then((data) => {
        let jsonFeatures = [];
        data.forEach((point) => {
            let lat = Number(point.latitude);
            let lon = Number(point.longitude);
            // console.log(point);
            let pt = turf.point([lon, lat]);
            if (turf.booleanPointInPolygon(pt, pro) === true) {
                const url = `http://119.59.125.191/geoserver/omfs/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=omfs:tambon&outputFormat=application%2Fjson&CQL_FILTER=INTERSECTS(geom,Point(${lon}%20${lat}))`;
                request({
                    url: url,
                    json: true
                }, (err, res, body) => {
                    point.tam = body.features[0].properties;
                    let feature = {
                        type: 'Feature',
                        properties: point,
                        geometry: {
                            type: 'Point',
                            coordinates: [lon, lat]
                        }
                    };
                    jsonFeatures.push(feature);
                });
            };
        })

        setTimeout(() => {
            let geoJson = {
                type: 'FeatureCollection',
                features: jsonFeatures
            };
            res.status(200).json({
                cratus: 'success',
                data: geoJson,
                message: 'retrived survey data'
            })
        }, 500)

    }).catch((error) => {
        return next(error)
    })
});
var poly = turf.polygon(prv.features[0].geometry.coordinates[0]);

//var poly = turf.polygon(prv.features[0].geometry.coordinates[0]);

router.get("/hp_modis", async function (req, res, next) {
    csv().fromStream(request.get('https://firms.modaps.eosdis.nasa.gov/active_fire/c6/text/MODIS_C6_SouthEast_Asia_7d.csv'))
        // csv().fromStream(request.get('https://firms.modaps.eosdis.nasa.gov/active_fire/c6/text/MODIS_C6_SouthEast_Asia_7d.csv'))
        .then(async (data) => {

            let jsonFeatures = [];
            let ph = 0;
            let py = 0;
            let nn = 0;
            let cr = 0;
            data.forEach((point) => {
                // let lat = Number(point.latitnne);
                // let lon = Number(point.longitnne);
                //console.log(data);  
                let lat = Number(point.latitude);
                let lon = Number(point.longitude);
                let pt = turf.point([lon, lat]);
                if (turf.booleanPointInPolygon(pt, poly_ph) == true) ph += 1;
                if (turf.booleanPointInPolygon(pt, poly_py) == true) py += 1;
                if (turf.booleanPointInPolygon(pt, poly_nn) == true) nn += 1;
                if (turf.booleanPointInPolygon(pt, poly_cr) == true) cr += 1;
                if (turf.booleanPointInPolygon(pt, poly) == true) {

                    let feature = {
                        type: 'Feature',
                        properties: point,
                        geometry: {
                            type: 'Point',
                            coordinates: [lon, lat]
                        }
                    };
                    jsonFeatures.push(feature);
                    //console.log(feature); 
                    const sql = {
                        text: 'INSERT INTO hp_modis(latitude, longitude, brightness, scan, track, acq_date, acq_time, satellite, instrument, confidence, version, bright_t31, frp, daynight) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
                        //values: [point.latitude, point.longitude, point.brightness, point.scan, point.track, point.acq_date, point.acq_time, point.satellite, point.instrument, point.confidence, point.version, point.bright_t31, point.frp, point.daynight ],
                        values: [point.latitude, point.longitude, point.brightness, point.scan, point.track, point.acq_date, point.acq_time, point.satellite, point.instrument, point.confidence, point.version, point.bright_t31, point.frp, point.daynight],
                    }
                    db.query(sql)

                }
                //const sql = `INSERT INTO hp_modis (latitude, longitude, brightness, scan, track, acq_date, acq_time, satellite, instrument, confidence, version, bright_t31, frp) VALUES (data.latitude, data.longitude, data.brightness, data.scan, data.track, data.acq_date, 'data.acq_time', 'data.satellite', 'data.instrument', 'data.confidence', 'data.version', data.bright_t31, data.frp)`;
                //var user = req.body;
                //const sql = {
                // text: 'INSERT INTO hp_modis(latitude, longitude, brightness, scan, track, acq_date, acq_time, satellite, instrument, confidence, version, bright_t31, frp, daynight) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
                //values: [point.latitude, point.longitude, point.brightness, point.scan, point.track, point.acq_date, point.acq_time, point.satellite, point.instrument, point.confidence, point.version, point.bright_t31, point.frp, point.daynight ],   
                //}
                // db.query(sql)

            });
            let geoJson = {
                type: 'FeatureCollection',
                features: jsonFeatures
            };
            await res.status(200).json({
                cratus: 'success',
                ph: ph,
                py: py,
                nn: nn,
                cr: cr,
                data: geoJson,
                message: 'retrived survey data'
            })
        }).catch((error) => {
            return next(error)
        })
});

router.get("/hp_modis24", async function (req, res, next) {
    //csv().fromStream(request.get('http://119.59.125.191/geolab/hotspot3.csv'))
    csv().fromStream(request.get('https://firms.modaps.eosdis.nasa.gov/active_fire/c6/text/MODIS_C6_SouthEast_Asia_24h.csv'))
        .then(async (data) => {
            let jsonFeatures = [];
            let ph = 0;
            let py = 0;
            let nn = 0;
            let cr = 0;
            data.forEach((point) => {

                let lat = Number(point.latitude);
                let lon = Number(point.longitude);
                let pt = turf.point([lon, lat]);
                if (turf.booleanPointInPolygon(pt, poly_ph) == true) ph += 1;
                if (turf.booleanPointInPolygon(pt, poly_py) == true) py += 1;
                if (turf.booleanPointInPolygon(pt, poly_nn) == true) nn += 1;
                if (turf.booleanPointInPolygon(pt, poly_cr) == true) cr += 1;
                if (turf.booleanPointInPolygon(pt, poly) == true) {

                    let feature = {
                        type: 'Feature',
                        properties: point,
                        geometry: {
                            type: 'Point',
                            coordinates: [lon, lat]
                        }
                    };
                    jsonFeatures.push(feature);
                }

            });
            let geoJson = {
                type: 'FeatureCollection',
                features: jsonFeatures
            };
            await res.status(200).json({
                cratus: 'success',
                ph: ph,
                py: py,
                nn: nn,
                cr: cr,
                data: geoJson,
                message: 'retrived survey data'
            })
        }).catch((error) => {
            return next(error)
        })
});


router.get("/hp_modis48", async function (req, res, next) {
    csv().fromStream(request.get('https://firms.modaps.eosdis.nasa.gov/active_fire/c6/text/MODIS_C6_SouthEast_Asia_48h.csv'))
        // csv().fromStream(request.get('https://firms.modaps.eosdis.nasa.gov/active_fire/c6/text/MODIS_C6_SouthEast_Asia_7d.csv'))
        .then(async (data) => {

            let jsonFeatures = [];
            let ph = 0;
            let py = 0;
            let nn = 0;
            let cr = 0;
            data.forEach((point) => {
                let lat = Number(point.latitude);
                let lon = Number(point.longitude);
                let pt = turf.point([lon, lat]);
                if (turf.booleanPointInPolygon(pt, poly_ph) == true) ph += 1;
                if (turf.booleanPointInPolygon(pt, poly_py) == true) py += 1;
                if (turf.booleanPointInPolygon(pt, poly_nn) == true) nn += 1;
                if (turf.booleanPointInPolygon(pt, poly_cr) == true) cr += 1;
                if (turf.booleanPointInPolygon(pt, poly) == true) {

                    let feature = {
                        type: 'Feature',
                        properties: point,
                        geometry: {
                            type: 'Point',
                            coordinates: [lon, lat]
                        }
                    };
                    jsonFeatures.push(feature);
                }

            });
            let geoJson = {
                type: 'FeatureCollection',
                features: jsonFeatures
            };
            await res.status(200).json({
                cratus: 'success',
                ph: ph,
                py: py,
                nn: nn,
                cr: cr,
                data: geoJson,
                message: 'retrived survey data'
            })
        }).catch((error) => {
            return next(error)
        })
});

router.get("/hp_modis7", async function (req, res, next) {
    csv().fromStream(request.get('https://firms.modaps.eosdis.nasa.gov/active_fire/c6/text/MODIS_C6_SouthEast_Asia_7d.csv'))
        // csv().fromStream(request.get('https://firms.modaps.eosdis.nasa.gov/active_fire/c6/text/MODIS_C6_SouthEast_Asia_7d.csv'))
        .then(async (data) => {

            let jsonFeatures = [];
            let ph = 0;
            let py = 0;
            let nn = 0;
            let cr = 0;
            data.forEach((point) => {
                let lat = Number(point.latitude);
                let lon = Number(point.longitude);
                let pt = turf.point([lon, lat]);
                if (turf.booleanPointInPolygon(pt, poly_ph) == true) ph += 1;
                if (turf.booleanPointInPolygon(pt, poly_py) == true) py += 1;
                if (turf.booleanPointInPolygon(pt, poly_nn) == true) nn += 1;
                if (turf.booleanPointInPolygon(pt, poly_cr) == true) cr += 1;
                if (turf.booleanPointInPolygon(pt, poly) == true) {

                    let feature = {
                        type: 'Feature',
                        properties: point,
                        geometry: {
                            type: 'Point',
                            coordinates: [lon, lat]
                        }
                    };
                    jsonFeatures.push(feature);

                }

            });
            let geoJson = {
                type: 'FeatureCollection',
                features: jsonFeatures
            };
            await res.status(200).json({
                cratus: 'success',
                ph: ph,
                py: py,
                nn: nn,
                cr: cr,
                data: geoJson,
                message: 'retrived survey data'
            })
        }).catch((error) => {
            return next(error)
        })
});

router.get("/hp_viirs", async function (req, res, next) {
    csv().fromStream(request.get('https://firms.modaps.eosdis.nasa.gov/active_fire/viirs/text/VNP14IMGTDL_NRT_SouthEast_Asia_7d.csv'))
        .then(async (data) => {
            let jsonFeatures = [];
            let ph = 0;
            let py = 0;
            let nn = 0;
            let cr = 0;
            data.forEach(function (point) {
                let lat = Number(point.latitude);
                let lon = Number(point.longitude);
                let pt = turf.point([lon, lat]);
                if (turf.booleanPointInPolygon(pt, poly_ph) == true) ph += 1;
                if (turf.booleanPointInPolygon(pt, poly_py) == true) py += 1;
                if (turf.booleanPointInPolygon(pt, poly_nn) == true) nn += 1;
                if (turf.booleanPointInPolygon(pt, poly_cr) == true) cr += 1;
                if (turf.booleanPointInPolygon(pt, poly) == true) {


                    let feature = {
                        type: 'Feature',
                        properties: point,
                        geometry: {
                            type: 'Point',
                            coordinates: [lon, lat]

                        }
                    };
                    jsonFeatures.push(feature);

                    const sql = {
                        text: 'INSERT INTO hp_modis(latitude, longitude, bright_ti4, scan, track, acq_date, acq_time, satellite, instrument, confidence, version, bright_ti5, frp, daynight) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
                        values: [point.latitude, point.longitude, point.bright_ti4, point.scan, point.track, point.acq_date, point.acq_time, point.satellite, point.instrument, point.confidence, point.version, point.bright_ti5, point.frp, point.daynight],
                    }
                    db.query(sql)

                }

            });
            let geoJson = {
                type: 'FeatureCollection',
                features: jsonFeatures
            };
            await res.status(200).json({
                cratus: 'success',
                ph: ph,
                py: py,
                nn: nn,
                cr: cr,
                data: geoJson,
                message: 'retrived survey data'
            });

        }).catch((error) => {
            return next(error)
        })
});

router.get("/hp_viirs24", async function (req, res, next) {
    csv().fromStream(request.get('https://firms.modaps.eosdis.nasa.gov/active_fire/viirs/text/VNP14IMGTDL_NRT_SouthEast_Asia_24h.csv'))
        .then(async (data) => {
            let jsonFeatures = [];
            let ph = 0;
            let py = 0;
            let nn = 0;
            let cr = 0;
            data.forEach(function (point) {
                let lat = Number(point.latitude);
                let lon = Number(point.longitude);
                let pt = turf.point([lon, lat]);
                if (turf.booleanPointInPolygon(pt, poly_ph) == true) ph += 1;
                if (turf.booleanPointInPolygon(pt, poly_py) == true) py += 1;
                if (turf.booleanPointInPolygon(pt, poly_nn) == true) nn += 1;
                if (turf.booleanPointInPolygon(pt, poly_cr) == true) cr += 1;
                if (turf.booleanPointInPolygon(pt, poly) == true) {


                    let feature = {
                        type: 'Feature',
                        properties: point,
                        geometry: {
                            type: 'Point',
                            coordinates: [lon, lat]

                        }
                    };
                    jsonFeatures.push(feature);
                }

            });
            let geoJson = {
                type: 'FeatureCollection',
                features: jsonFeatures
            };
            await res.status(200).json({
                cratus: 'success',
                ph: ph,
                py: py,
                nn: nn,
                cr: cr,
                data: geoJson,
                message: 'retrived survey data'
            });

        }).catch((error) => {
            return next(error)
        })
});

router.get("/hp_viirs48", async function (req, res, next) {
    csv().fromStream(request.get('https://firms.modaps.eosdis.nasa.gov/active_fire/viirs/text/VNP14IMGTDL_NRT_SouthEast_Asia_48h.csv'))
        .then(async (data) => {
            let jsonFeatures = [];
            let ph = 0;
            let py = 0;
            let nn = 0;
            let cr = 0;
            data.forEach(function (point) {
                let lat = Number(point.latitude);
                let lon = Number(point.longitude);
                let pt = turf.point([lon, lat]);
                if (turf.booleanPointInPolygon(pt, poly_ph) == true) ph += 1;
                if (turf.booleanPointInPolygon(pt, poly_py) == true) py += 1;
                if (turf.booleanPointInPolygon(pt, poly_nn) == true) nn += 1;
                if (turf.booleanPointInPolygon(pt, poly_cr) == true) cr += 1;
                if (turf.booleanPointInPolygon(pt, poly) == true) {


                    let feature = {
                        type: 'Feature',
                        properties: point,
                        geometry: {
                            type: 'Point',
                            coordinates: [lon, lat]

                        }
                    };
                    jsonFeatures.push(feature);
                }

            });
            let geoJson = {
                type: 'FeatureCollection',
                features: jsonFeatures
            };
            await res.status(200).json({
                cratus: 'success',
                ph: ph,
                py: py,
                nn: nn,
                cr: cr,
                data: geoJson,
                message: 'retrived survey data'
            });

        }).catch((error) => {
            return next(error)
        })
});

router.get("/hp_viirs7", async function (req, res, next) {
    csv().fromStream(request.get('https://firms.modaps.eosdis.nasa.gov/active_fire/viirs/text/VNP14IMGTDL_NRT_SouthEast_Asia_7d.csv'))
        .then(async (data) => {
            let jsonFeatures = [];
            let ph = 0;
            let py = 0;
            let nn = 0;
            let cr = 0;
            data.forEach(function (point) {
                let lat = Number(point.latitude);
                let lon = Number(point.longitude);
                let pt = turf.point([lon, lat]);
                if (turf.booleanPointInPolygon(pt, poly_ph) == true) ph += 1;
                if (turf.booleanPointInPolygon(pt, poly_py) == true) py += 1;
                if (turf.booleanPointInPolygon(pt, poly_nn) == true) nn += 1;
                if (turf.booleanPointInPolygon(pt, poly_cr) == true) cr += 1;
                if (turf.booleanPointInPolygon(pt, poly) == true) {


                    let feature = {
                        type: 'Feature',
                        properties: point,
                        geometry: {
                            type: 'Point',
                            coordinates: [lon, lat]

                        }
                    };
                    jsonFeatures.push(feature);
                }

            });
            let geoJson = {
                type: 'FeatureCollection',
                features: jsonFeatures
            };
            await res.status(200).json({
                cratus: 'success',
                ph: ph,
                py: py,
                nn: nn,
                cr: cr,
                data: geoJson,
                message: 'retrived survey data'
            });

        }).catch((error) => {
            return next(error)
        })
});

module.exports = router;