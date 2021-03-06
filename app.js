// const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

// CORS ot
app.use(cors());
app.options('*', cors());

app.use(function (req, res, next) {
     res.setHeader('Access-Control-Allow-Origin', '*');
     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
     res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
     res.setHeader('Access-Control-Allow-Credentials', true);
     next();
});

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}));

const hotspot = require('./hotspot');
app.use('/hp', hotspot);

app.listen(3000, () => {
    console.log('listening on port 3000...')
});

// const th = con.th;
app.get('/', (req, res) => {
    res.send('node api');
});