// const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

// CORS ot
app.use(cors());
app.options('*', cors());

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}));

// const workshop = require('./workshop');
// const nomosq = require('./nomosq');
const hotspot = require('./hotspot');
// const cdpcm = require('./cdpcm');
// const pro40 = require('./province40');
// const weather = require('./weather');
// const tour = require('./tour');

// app.use('/workshop_api', workshop);
// app.use('/api', nomosq);
app.use('/hp', hotspot);
// app.use('/cdpcm', cdpcm);
// app.use('/pro40', pro40);
// app.use('/weather', weather);
// app.use('/tour', tour);

app.listen(3000, () => {
    console.log('listening on port 3000...')
});



// const th = con.th;

app.get('/', (req, res) => {
    res.send('node api');
});