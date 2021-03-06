const express = require('express');
const router = express.Router();

const request = require('request');
const csv = require('csvtojson');
const turf = require('@turf/turf');

const Pool = require('pg').Pool
const db = new Pool({
    user: 'postgres',
    host: '119.59.125.191',
    database: 'omfs',
    password: '##firehp@postgis##',
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

router.get("/getamp/:procode", (req, res, next) => {
    const procode = req.params.procode;
    const sql = `SELECT ap_code, ap_tn, pv_code, pv_tn FROM amphoe WHERE pv_code = '${procode}'`;
    db.query(sql).then(data => {
        res.status(200).json({
            status: 'success',
            data: data.rows,
            message: 'retrived data'
        });
    }).catch(err => {
        return next(err);
    });
});

router.get("/gettam/:ampcode", (req, res, next) => {
    const ampcode = req.params.ampcode;
    const sql = `SELECT tb_code, tb_tn, ap_code, ap_tn FROM tambon WHERE ap_code = '${ampcode}'`;
    db.query(sql).then(data => {
        res.status(200).json({
            status: 'success',
            data: data.rows,
            message: 'retrived data'
        });
    }).catch(err => {
        return next(err);
    });
});

router.get("/hpamp/:procode", (req, res, next) => {
    const procode = req.params.procode;
    const urlServer = 'http://119.59.125.191/geolab/hotspot2.csv';
    const urlFirms = 'https://firms.modaps.eosdis.nasa.gov/active_fire/c6/text/MODIS_C6_SouthEast_Asia_24h.csv';
    csv().fromStream(request.get(urlFirms)).then((data) => {
        let jsonFeatures = [];
        data.forEach((point) => {
            let lat = Number(point.latitude);
            let lon = Number(point.longitude);
            // console.log(point);
            let pt = turf.point([lon, lat]);
            if (turf.booleanPointInPolygon(pt, pro) === true) {
                const url = `http://119.59.125.191/geoserver/omfs/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=omfs:amphoe&outputFormat=application%2Fjson&CQL_FILTER=INTERSECTS(geom,Point(${lon}%20${lat}))`;
                request({
                    url: url,
                    json: true
                }, (err, res, body) => {
                    if (body.features[0].properties.pv_code === `${procode}`) {
                        point.admin = body.features[0].properties;
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
            };
        });
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
        }, 2500);
    }).catch((error) => {
        return next(error)
    })
});

router.get("/hptam/:ampcode", (req, res, next) => {
    const ampcode = req.params.ampcode;
    const urlServer = 'http://119.59.125.191/geolab/hotspot2.csv';
    const urlFirms = 'https://firms.modaps.eosdis.nasa.gov/active_fire/c6/text/MODIS_C6_SouthEast_Asia_24h.csv';
    csv().fromStream(request.get(urlFirms)).then((data) => {
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
                    if (body.features[0].properties.ap_code === `${ampcode}`) {
                        point.admin = body.features[0].properties;
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
            };
        });
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
        }, 2500);
    }).catch((error) => {
        return next(error)
    })
});

router.get("/hpamp7d/:procode", (req, res, next) => {
    const procode = req.params.procode;
    const urlServer = 'http://119.59.125.191/geolab/hotspot.csv';
    const urlFirms = 'https://firms.modaps.eosdis.nasa.gov/active_fire/c6/text/MODIS_C6_SouthEast_Asia_7d.csv';
    csv().fromStream(request.get(urlFirms)).then((data) => {
        let jsonFeatures = [];
        data.forEach((point) => {
            let lat = Number(point.latitude);
            let lon = Number(point.longitude);
            // console.log(point);
            let pt = turf.point([lon, lat]);
            if (turf.booleanPointInPolygon(pt, pro) === true) {
                const url = `http://119.59.125.191/geoserver/omfs/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=omfs:amphoe&outputFormat=application%2Fjson&CQL_FILTER=INTERSECTS(geom,Point(${lon}%20${lat}))`;
                request({
                    url: url,
                    json: true
                }, (err, res, body) => {
                    if (body.features[0].properties.pv_code === `${procode}`) {
                        point.admin = body.features[0].properties;
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
            };
        });
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
        }, 2500);
    }).catch((error) => {
        return next(error)
    })
});


var poly = turf.polygon(prv.features[0].geometry.coordinates[0]);

//var poly = turf.polygon(prv.features[0].geometry.coordinates[0]);

router.get("/insert_modis", async function (req, res, next) {
        const urlFirms = 'https://firms.modaps.eosdis.nasa.gov/active_fire/c6/text/MODIS_C6_SouthEast_Asia_7d.csv';
        csv().fromStream(request.get(urlFirms)).then( async (data) => {
            let jsonFeatures = [];
            data.forEach((point) => {
                let lat = Number(point.latitude);
                let lon = Number(point.longitude);
                // console.log(point);
                let pt = turf.point([lon, lat]);
                if (turf.booleanPointInPolygon(pt, pro) === true) {
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
                        text: 'INSERT INTO rt_modis(latitude, longitude, brightness, scan, track, acq_date, acq_time, satellite, instrument, confidence, version, bright_t31, frp, daynight) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',

                        values: [point.latitude, point.longitude, point.brightness, point.scan, point.track, point.acq_date, point.acq_time, point.satellite, point.instrument, point.confidence, point.version, point.bright_t31, point.frp, point.daynight],
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
                data: geoJson,
                message: 'retrived survey data'
            })
        }).catch((error) => {
            return next(error)
        })
});


router.get("/hp_modis24", async function (req, res, next) {
	const urlFi = 'http://119.59.125.191/geolab/hotspot2.csv';
    const urlFirms = 'https://firms.modaps.eosdis.nasa.gov/active_fire/c6/text/MODIS_C6_SouthEast_Asia_24h.csv';
    csv().fromStream(request.get(urlFirms)).then( async (data) => {
        //console.log(data)
        let jsonFeatures = [];
         data.forEach((point) => {
            let lat = Number(point.latitude);
            let lon = Number(point.longitude);
            // console.log(point);
            let pt = turf.point([lon, lat]);
            if (turf.booleanPointInPolygon(pt, pro) === true) {
                const url =  `http://119.59.125.191/geoserver/omfs/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=omfs:tambon&outputFormat=application%2Fjson&CQL_FILTER=INTERSECTS(geom,Point(${lon}%20${lat}))`;
                //const url =  `gis_data/tambon.geojson&CQL_FILTER=INTERSECTS(geom,Point(${lon}%20${lat}))`;
                request({
                    url: url,
                    json: true
                }, async (err, res, body) => {
                   
                    point.tam =  body.features[0].properties;
                    let feature =  {
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
            let geoJson =  {
                type: 'FeatureCollection',
                features: jsonFeatures
            };
             res.status(200).json({
                cratus: 'success',
                data: geoJson,
                message: 'retrived survey data'
            })
        }, 2500)

    }).catch((error) => {
        return next(error)
    })
});

router.get("/onesignal24", async function (req, res, next) {
    const urlServer = 'http://119.59.125.191/geolab/hotspot2.csv';
    //const urlFirms = 'https://firms.modaps.eosdis.nasa.gov/active_fire/c6/text/MODIS_C6_SouthEast_Asia_24h.csv';
    csv().fromStream(request.get(urlServer)).then( async (data) => {
        //console.log(data)
        let jsonFeatures_py = [];
        let jsonFeatures_cr = [];
        let jsonFeatures_pr = [];
        let jsonFeatures_nn = [];
         data.forEach((point) => {
            let lat = Number(point.latitude);
            let lon = Number(point.longitude);
            // console.log(point);
            let pt = turf.point([lon, lat]);
            if (turf.booleanPointInPolygon(pt, pro) === true) {
                const url =  `http://119.59.125.191/geoserver/omfs/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=omfs:tambon&outputFormat=application%2Fjson&CQL_FILTER=INTERSECTS(geom,Point(${lon}%20${lat}))`;
                //const url =  `gis_data/tambon.geojson&CQL_FILTER=INTERSECTS(geom,Point(${lon}%20${lat}))`;
                request({
                    url: url,
                    json: true
                }, async (err, res, body) => {
                    point.tam =  body.features[0].properties.pv_tn;

               // console.log(point.tam);
                    if ( body.features[0].properties.pv_tn == 'พะเยา'){
                        let feature =  {
                            properties: body.features[0].properties.pv_tn,
                        };
                        jsonFeatures_py.push(feature); 
                    }
                    if ( body.features[0].properties.pv_tn == 'เชียงราย'){
                        let feature =  {
                            properties: body.features[0].properties.pv_tn,
                        };
                        jsonFeatures_cr.push(feature); 
                    }
                    if ( body.features[0].properties.pv_tn == 'แพร่'){
                        let feature =  {
                            properties: body.features[0].properties.pv_tn,
                        };
                        jsonFeatures_pr.push(feature); 
                    }
                    if ( body.features[0].properties.pv_tn == 'น่าน'){
                        let feature =  {
                            properties: body.features[0].properties.pv_tn,
                        };
                        jsonFeatures_nn.push(feature); 
                    }

                   
                   
                });
            };
        })

        setTimeout(() => {
            res.status(200).json({
                เชียงราย: jsonFeatures_cr.length,
                พะเยา: jsonFeatures_py.length,
                แพร่: jsonFeatures_pr.length,
                น่าน: jsonFeatures_nn.length

            })

            if(jsonFeatures_py.length > 0){
                var sendNotification = function (data) {
                    var headers = {
                        "Content-Type": "application/json; charset=utf-8",
                        "Authorization": "Basic MWE1YTIxNzgtMTZjMS00NzdhLWI4ZTktMDFmMzY1NDYyODNm"
                    };
                
                    var options = {
                        host: "onesignal.com",
                        port: 443,
                        path: "/api/v1/notifications",
                        method: "POST",
                        headers: headers
                    };
                
                    var https = require('https');
                    var req = https.request(options, function (res) {
                        res.on('data', function (data) {
                            console.log("Response:");
                            console.log(JSON.parse(data));
                        });
                    });
                
                    req.on('error', function (e) {
                        console.log("ERROR:");
                        console.log(e);
                    });
                
                    req.write(JSON.stringify(data));
                    req.end();
                };
                
                var message = {
                    app_id: "79500f59-2cca-4a08-bfff-7d36712b6ec8",
                    contents: {
                        "en": "คำเตือน : พบจุดความร้อนในเขตพื้นที่จังหวัดพะเยา จำนวน "+jsonFeatures_py.length+" จุด"
                    },
                    included_segments: ["All"]
                };
                
                sendNotification(message);
            }
            if(jsonFeatures_cr.length > 0){
                var sendNotification = function (data) {
                    var headers = {
                        "Content-Type": "application/json; charset=utf-8",
                        "Authorization": "Basic YjNlMGQwOTItZDc0OS00NTEyLWJiMjctNTA4MmM4MGMwZGZi"
                    };
                
                    var options = {
                        host: "onesignal.com",
                        port: 443,
                        path: "/api/v1/notifications",
                        method: "POST",
                        headers: headers
                    };
                
                    var https = require('https');
                    var req = https.request(options, function (res) {
                        res.on('data', function (data) {
                            console.log("Response:");
                            console.log(JSON.parse(data));
                        });
                    });
                
                    req.on('error', function (e) {
                        console.log("ERROR:");
                        console.log(e);
                    });
                
                    req.write(JSON.stringify(data));
                    req.end();
                };
                
                var message = {
                    app_id: "ea4c69a5-c253-4025-815f-85648d07726f",
                    contents: {
                        "en": "คำเตือน : พบจุดความร้อนในเขตพื้นที่จังหวัดเชียงราย จำนวน "+jsonFeatures_cr.length+" จุด"
                    },
                    included_segments: ["All"]
                };
                
                sendNotification(message);
            }
            if(jsonFeatures_pr.length > 0){
                var sendNotification = function (data) {
                    var headers = {
                        "Content-Type": "application/json; charset=utf-8",
                        "Authorization": "Basic OTdiZjhmYTAtYTVmMy00YWE4LWJkNTktMjQxZWU2NzMzNTU3"
                    };
                
                    var options = {
                        host: "onesignal.com",
                        port: 443,
                        path: "/api/v1/notifications",
                        method: "POST",
                        headers: headers
                    };
                
                    var https = require('https');
                    var req = https.request(options, function (res) {
                        res.on('data', function (data) {
                            console.log("Response:");
                            console.log(JSON.parse(data));
                        });
                    });
                
                    req.on('error', function (e) {
                        console.log("ERROR:");
                        console.log(e);
                    });
                
                    req.write(JSON.stringify(data));
                    req.end();
                };
                
                var message = {
                    app_id: "c2732646-0e7a-4ea3-a53c-9409d2cfda7d",
                    contents: {
                        "en": "คำเตือน : พบจุดความร้อนในเขตพื้นที่จังหวัดแพร่ จำนวน "+jsonFeatures_pr.length+" จุด"
                    },
                    included_segments: ["All"]
                };
                
                sendNotification(message);
            }
            if(jsonFeatures_nn.length > 0){
                var sendNotification = function (data) {
                    var headers = {
                        "Content-Type": "application/json; charset=utf-8",
                        "Authorization": "Basic NmU5MTdjY2MtYjhmNi00M2QyLWJjZTQtNjFiM2JjM2EyOThm"
                    };
                
                    var options = {
                        host: "onesignal.com",
                        port: 443,
                        path: "/api/v1/notifications",
                        method: "POST",
                        headers: headers
                    };
                
                    var https = require('https');
                    var req = https.request(options, function (res) {
                        res.on('data', function (data) {
                            console.log("Response:");
                            console.log(JSON.parse(data));
                        });
                    });
                
                    req.on('error', function (e) {
                        console.log("ERROR:");
                        console.log(e);
                    });
                
                    req.write(JSON.stringify(data));
                    req.end();
                };
                
                var message = {
                    app_id: "51d3803e-864f-4498-8990-d9ee471ea60b",
                    contents: {
                        "en": "คำเตือน : พบจุดความร้อนในเขตพื้นที่จังหวัดน่าน จำนวน "+jsonFeatures_nn.length+" จุด"
                    },
                    included_segments: ["All"]
                };
                
                sendNotification(message);
            }

        }, 2500)

    }).catch((error) => {
        return next(error)
    })
});

router.get("/hp_modis48", async function (req, res, next) {
        const urlFirms = 'https://firms.modaps.eosdis.nasa.gov/active_fire/c6/text/MODIS_C6_SouthEast_Asia_48h.csv';
        csv().fromStream(request.get(urlFirms)).then((data) => {
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
            }, 2500)
    
        }).catch((error) => {
            return next(error)
        })
});

router.get("/insert_modis48", async function (req, res, next) {
    // const urlServer = 'http://119.59.125.191/geolab/hotspot2.csv';
     const urlFirms = 'https://firms.modaps.eosdis.nasa.gov/active_fire/c6/text/MODIS_C6_SouthEast_Asia_48h.csv';
    
    const drp = `DROP TABLE IF EXISTS rt_modis48;

    CREATE TABLE rt_modis48
    (
        gid SERIAL,
        latitude numeric,
        longitude numeric,
        brightness numeric,
        scan numeric,
        track numeric,
        acq_date date,
        acq_time character varying(4),
        satellite character varying(5),
        instrument character varying(5),
        confidence numeric,
        version character varying(6),
        bright_t31 numeric,
        frp numeric,
        tb_code character varying(6),
        tb_tn character varying(78),
        tb_en character varying(50),
        ap_code character varying(4),
        ap_tn character varying(60),
        ap_en character varying(50),
        pv_code character varying(2),
        pv_tn character varying(50),
        pv_en character varying(50),
        re_nesdb character varying(50),
        re_royin character varying(50),
        admin_type numeric,
        daynight character varying(1),
        status character varying(254),
        CONSTRAINT rt_modis48_pkey PRIMARY KEY (gid) )`;

    db.query(drp)

    csv().fromStream(request.get(urlFirms)).then( async (data) => {
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

                const sql = {
                    text: 'INSERT INTO rt_modis48(latitude, longitude, brightness, scan, track, acq_date, acq_time, satellite, instrument, confidence, version, bright_t31, frp, tb_code, tb_tn, tb_en, ap_code, ap_tn, ap_en, pv_code, pv_tn, pv_en, re_nesdb, re_royin, admin_type, daynight,status) \
                     VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26,$27)',

                    values: [point.latitude, point.longitude, point.brightness, point.scan, point.track, point.acq_date, point.acq_time, point.satellite, point.instrument, point.confidence, point.version, point.bright_t31, point.frp, point.tam.tb_code, point.tam.tb_tn, point.tam.tb_en, point.tam.ap_code, point.tam.ap_tn, point.tam.ap_en, point.tam.pv_code, point.tam.pv_tn, point.tam.pv_en, point.tam.re_nesdb, point.tam.re_royin, point.tam.admin_type, point.daynight,'type3'],
                }
                db.query(sql)

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
    }, 2500)


     }).catch((error) => {
         return next(error)
     })
});

router.get("/hp_modis7", async function (req, res, next) {
        const urlFirms = 'https://firms.modaps.eosdis.nasa.gov/active_fire/c6/text/MODIS_C6_SouthEast_Asia_7d.csv';
        csv().fromStream(request.get(urlFirms)).then((data) => {
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
            }, 2500)
    
        }).catch((error) => {
            return next(error)
        })
});

router.get("/insert_viirs", async function (req, res, next) {
    const urlFirms = 'https://firms.modaps.eosdis.nasa.gov/active_fire/viirs/text/VNP14IMGTDL_NRT_SouthEast_Asia_7d.csv';
    csv().fromStream(request.get(urlFirms)).then( async (data) => {
        let jsonFeatures = [];
        data.forEach((point) => {
            let lat = Number(point.latitude);
            let lon = Number(point.longitude);
            // console.log(point);
            let pt = turf.point([lon, lat]);
            if (turf.booleanPointInPolygon(pt, pro) === true) {
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
                    text: 'INSERT INTO rt_viirs(latitude, longitude, bright_ti4, scan, track, acq_date, acq_time, satellite, instrument, confidence, version, bright_ti5, frp, daynight) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
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
            data: geoJson,
            message: 'retrived survey data'
        });

    }).catch((error) => {
        return next(error)
    })
});

router.get("/hp_viirs24", async function (req, res, next) {
    const urlFirms = 'https://firms.modaps.eosdis.nasa.gov/active_fire/viirs/text/VNP14IMGTDL_NRT_SouthEast_Asia_24h.csv';
    csv().fromStream(request.get(urlFirms)).then((data) => {
        let jsonFeatures = [];
         data.forEach((point) => {
            let lat = Number(point.latitude);
            let lon = Number(point.longitude);
            // console.log(point);
            let pt = turf.point([lon, lat]);
            if (turf.booleanPointInPolygon(pt, pro) === true) {
                const url = `http://119.59.125.191/geoserver/omfs/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=omfs:tam_forest&outputFormat=application%2Fjson&CQL_FILTER=INTERSECTS(geom,Point(${lon}%20${lat}))`;
                request({
                    url: url,
                    json: true
                }, (err, res, body) => {
                    //console.log(body.features)
                    point.tam = body.features;
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
        }, 2500)

    }).catch((error) => {
        return next(error)
    })
});

router.get("/hp_viirs48", async function (req, res, next) {
    const urlFirms = 'https://firms.modaps.eosdis.nasa.gov/active_fire/viirs/text/VNP14IMGTDL_NRT_SouthEast_Asia_48h.csv';
    csv().fromStream(request.get(urlFirms)).then((data) => {
        let jsonFeatures = [];
        data.forEach((point) => {
            let lat = Number(point.latitude);
            let lon = Number(point.longitude);
            // console.log(point);
            let pt = turf.point([lon, lat]);
            if (turf.booleanPointInPolygon(pt, pro) === true) {
                const url = `http://119.59.125.191/geoserver/omfs/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=omfs:tam_forest&outputFormat=application%2Fjson&CQL_FILTER=INTERSECTS(geom,Point(${lon}%20${lat}))`;
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
        }, 2500)

    }).catch((error) => {
        return next(error)
    })
});

router.get("/hp_viirs7", async function (req, res, next) {
    const urlFirms = 'https://firms.modaps.eosdis.nasa.gov/active_fire/viirs/text/VNP14IMGTDL_NRT_SouthEast_Asia_7d.csv';
    csv().fromStream(request.get(urlFirms)).then((data) => {
        let jsonFeatures = [];
        data.forEach((point) => {
            let lat = Number(point.latitude);
            let lon = Number(point.longitude);
            // console.log(point);
            let pt = turf.point([lon, lat]);
            if (turf.booleanPointInPolygon(pt, pro) === true) {
                const url = `http://119.59.125.191/geoserver/omfs/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=omfs:tam_forest&outputFormat=application%2Fjson&CQL_FILTER=INTERSECTS(geom,Point(${lon}%20${lat}))`;
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
        }, 2500)

    }).catch((error) => {
        return next(error)
    })
});

module.exports = router;
