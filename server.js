var express = require('express');
var app = express();
var request = require('request');
var fs = require('fs');
var LocalStrategy = require('passport-local').Strategy
var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var glob = require('glob');
var passport = require('passport');
var expressSession = require('express-session');
var redis = require("redis"),
    client = redis.createClient();

client.on("error", function (err) {
    console.log("Error " + err);
});

app.use(express.static(__dirname + '/client'));
app.set('views', __dirname + '/client');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(expressSession({secret: 'mySecretKey'}));
app.use(passport.initialize())  
app.use(passport.session())  

var flash = require('connect-flash');
app.use(flash());

app.use('/', express.static('client/static'));

app.use('/img', express.static('client/img'));

app.get('/', function(req, res){
    res.sendFile('index.html', {root:'./client'});
});

app.get('/dash', isAuthenticated, function(req, res){
    res.render('dash.html', { username: req.user.user });
});

app.get('/mentions', isAuthenticated, function(req, res){
    res.render('mentions.html', { username: req.user.user });
});

app.get('/structured', isAuthenticated, function(req, res){
    res.sendFile('structured.html', {root:'./client'});
});

app.get('/gettext', isAuthenticated, function(req, res){
    var incident = req.param('inc');
    var doc = '';
    client.get('incque:' + incident, function(err, reply){
        if (!err) doc=JSON.parse(reply)[0];
        var filename = 'data/CONLL/' + doc + '.conll';
        var edges = fs.readFileSync(filename, 'utf-8')
        .split('\n')
        .filter(Boolean);

        var to_return={};

        var maximum=4;

        client.get('incdoc:' + incident, function(err, reply){
        var answer_docs = JSON.parse(reply);
        cfiles=0;
        var current="";
        var current_spans={};
        var relevant=false;
        for (var j=0; j<edges.length; j++) {
            if (edges[j].startsWith("#begin document")){
                
                current=edges[j].replace("#begin document (", "").replace(");", "");
                if (answer_docs.indexOf(current)>=0) relevant=true;              
                else relevant = false;
            } else if (edges[j].startsWith("#end document")){
                if (relevant){
                    to_return[current] = current_spans;
                    current_spans={};
                    if (++cfiles==maximum){
                        break;
                    }
                }
            } else {
                if (relevant){
                    var fields=edges[j].split('\t');
                    var token_id = fields[0].substring(fields[0].indexOf('.')+1);
                    var token = fields[1];
                    current_spans[token_id]=token;
                }
            }
        }
        res.send(to_return);
        });
    });
});

app.get('/listincidents', isAuthenticated, function(req, res){
    var all_pattern = 'incstr:';
    client.keys(all_pattern + '*', function (err, all_incs) {
        if (!req.param('task') || (req.param('task')!='men' && req.param('task')!='str')) {
            res.send("Not OK. Such task does not exist. Choose either men or str.");
        } else {
        var user = req.user.user;
        var task = req.param('task');
        var ann_pattern = task + ":" + user + ":";
        client.keys(ann_pattern + '*', function (err, ann_incs) {
            var all_i = all_incs.map(function(x) { return x.replace(all_pattern, '');});
            var ann_i = new Set(ann_incs.map(function(x) { return x.split(':')[3];}));
            var intersection = new Set(all_i.filter(x => ann_i.has(x)));
            var difference = new Set(all_i.filter(x => !ann_i.has(x)));
            res.send({'new': Array.from(difference), 'old': Array.from(intersection)});
        });
        }
    });
});

app.get('/getstrdata', isAuthenticated, function(req, res){
    var inc = req.param('inc');
    client.get('incstr:' + inc, function(err, result){
        var jsonresult = JSON.parse(result);
        //result['participants'] = result['participants'].map(function(x) { return x.replace('incstr:', '');});
        res.send(jsonresult);
    });
});


// TODO: make sure it also works for structured data
app.get('/userstats', isAuthenticated, function(req, res){
    if (!req.param('task') || (req.param('task')!='men' && req.param('task')!='str')) {
        res.send("Not OK. Such task does not exist. Choose either men or str.");
    } else {
    var user = req.user.user;
    var task = req.param('task');
    var rkey_pattern = task + ":" + user + ":ann:*";
    client.keys(rkey_pattern, function (err, replies) {
        // NOTE: code in this callback is NOT atomic
        // this only happens after the the .exec call finishes.
        //client.mget(replies, redis.print);
        var count_inc=replies.length;
        c=0;
        if (!count_inc) res.send({'men_incs': count_inc, 'men_docs': 0});
        else {
            client.mget(replies, function(err, result){
                var docs = new Set();
                result.forEach(function(x) {
                    var xjson = JSON.parse(x);
                    var num_keys = Object.keys(xjson).length;
                    for (var k in xjson) docs.add(k.split('.')[0]);
                    if (++c==replies.length) res.send({'men_incs': count_inc, 'men_docs': docs.size});
                });
            });
        }
    })

    }
});

// TODO: check if the incident is valid
app.post('/storeannotations', function(req, res) {
    if (req.param('task') && req.param('incident') && req.param('annotations')){
        var task = req.param('task');
        var user = req.user.user;
        var rkey = task + ':' + user + ':ann:' + req.param('incident');
        client.set(rkey, JSON.stringify(req.param('annotations')));
        res.send("OK");
    } else {
        res.send("Not OK: incident id not specified, or no documents listed");
    }
});

// TODO: check if the incident is valid
app.post('/storedisqualified', function(req, res) {
    if (req.param('task') && req.param('incident')){
        var task = req.param('task');
        var user = req.user.user;
        var rkey = task + ':' + user + ':dis:' + req.param('incident');
        client.set(rkey, JSON.stringify(req.param('disqualification') || []));
        res.send("OK");
    } else {
        res.send("Not OK: incident id not specified, or no documents listed");
    }
});

app.post('/loadannotations', function(req, res){
    if (req.param('incident') && req.param('task')){
        var task = req.param('task');
        var user = req.user.user;
        var rkey = task + ':' + user + ':ann:' + req.param('incident');
        client.get(rkey, function(err, data){ 
            if (!err) res.send(JSON.parse(data));
        });
    } else {
        res.send("Not OK: incident id not specified");
    }
});

app.post('/loaddisqualified', function(req, res){
    if (req.param('incident') && req.param('task')){
        var task = req.param('task');
        var user = req.user.user;
        var rkey = task + ':' + user + ':dis:' + req.param('incident');
        client.get(rkey, function(err, data){
            if (!err) res.send(JSON.parse(data));
        });
    } else {
        res.send("Not OK: incident id not specified");
    }
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    fs.readFile('allowed.json', 'utf8', function (err, data) {
        if (err) throw err; // we'll not consider error handling for now
        var allowed = JSON.parse(data);
        if (allowed[username] && allowed[username]==password){
            done(null, { user: username });
        }
        else
        {
            done(null, false);
        }
   });
}));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

/* Handle Login POST */
app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/' }),
  function(req, res) {
    //res.redirect('/dash');
    res.send(200);
  });

// =====================================
// LOGOUT ==============================
// =====================================
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

// route middleware to make sure a user is logged in
function isAuthenticated(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}


/*
/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
*/

app.listen(8686, function() {
	console.log('started annotation tool nodejs backend');
});

module.exports = app;

