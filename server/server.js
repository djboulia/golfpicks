var loopback = require('loopback');
var boot = require('loopback-boot');
var data = require('./routes/data');
var bodyParser = require('body-parser');

var app = module.exports = loopback();

app.use(bodyParser.json());

//
//  implement our RESTful data handler
//
app.get('/data/classnames', data.showClasses);

app.get('/data/objects', data.showObjects);

app.post('/data/objects', data.createObject);

app.get('/data/objects/:id?', data.showObject);

app.delete('/data/objects/:id?', data.deleteObject);

app.put('/data/objects/:id?', data.updateObject);

//
//  PGA tour live scoring information here
//
app.get('/data/scores/:id?', data.showScore);


app.start = function () {
    // start the web server
    return app.listen(process.env.PORT || 3000, function () {
        app.emit('started');
        var baseUrl = app.get('url').replace(/\/$/, '');
        console.log('Web server listening at: %s', baseUrl);
        if (app.get('loopback-component-explorer')) {
            var explorerPath = app.get('loopback-component-explorer').mountPath;
            console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
        }
    });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function (err) {
    if (err) throw err;

    // start the server if `$ node server.js`
    if (require.main === module) {
        app.start();
    }
});