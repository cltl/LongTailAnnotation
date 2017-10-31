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
app.use(passport.session());  

var flash = require('connect-flash');
app.use(flash());

app.use('/', express.static('client/static'));

app.use('/img', express.static('client/img'));

app.use('/logs', express.static('client/logs'));

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
    res.render('structured.html', { username: req.user.user});
});

app.get('/gettext', isAuthenticated, function(req, res){
    var incident = req.query['inc'];
    var doc = '';
    client.get('incque:' + incident, function(err, reply){
        if (!err) doc=JSON.parse(reply)[0];
        var filename = 'test_data2/CONLL/' + doc + '.conll';
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

app.get('/getincinfo', isAuthenticated, function(req, res) {
    if (!req.query['inc']){
        res.sendStatus(400);//("Not OK: incident id not specified");
    } else{
        client.get('incinitstr:' + req.query['inc'], function(err, reply){
            res.send(reply);
        });
    }
});

app.get('/listincidents', isAuthenticated, function(req, res){
    if (!req.query['task'] || (req.query['task']!='men' && req.query['task']!='str')) {
        res.sendStatus(400);//("Not OK: incident id not specified");
    } else {
        if (req.query['task']=='men')
            var all_pattern = 'incstr:';
        else
            var all_pattern = 'incinitstr:';
        client.keys(all_pattern + '*', function (err, all_incs) {
            var user = req.user.user;
            var task = req.query['task'];
            var ann_pattern = task + ":" + user + ":";
            client.keys(ann_pattern + '*', function (err, ann_incs) {
                var all_i = all_incs.map(function(x) { return x.replace(all_pattern, '');});
                var ann_i = new Set(ann_incs.map(function(x) { return x.split(':')[3];}));
                var intersection = new Set(all_i.filter(x => ann_i.has(x)));
                var difference = new Set(all_i.filter(x => !ann_i.has(x)));
                res.send({'new': Array.from(difference), 'old': Array.from(intersection)});
            });
        });
    }
});

var isAdmin = function (u){
    return (['piek', 'roxane', 'filip', 'marten'].indexOf(u)>-1);
}

app.get('/exportannotations', isAuthenticated, function(req, res){
    if (req.query['annotator'] && req.query['task'] && req.query['ann'] && isAdmin(req.user.user)){
        var annotator = req.query['annotator'];
        var task = req.query['task'];
        var ann = req.query['ann'];
        var ann_pattern = task + ":" + annotator + ":" + ann + ":";
        client.keys(ann_pattern + '*', function(err, ann_incs){
            var annJson = {};
            var cnt = 0;
            if (!ann_incs.length) res.send(annotator + " has no annotations yet.");
            ann_incs.forEach(function (reply, index) {
                var incId=reply.split(':')[3];
                client.get(reply, function(err, data){
                    annJson[incId]=JSON.parse(data);
                    if (++cnt==ann_incs.length) {
                        res.setHeader('Content-disposition', 'attachment; filename=' + ann + '_' + annotator + '_' + task + '.json');
                        res.setHeader('Content-type', 'application/json');
                        res.write(JSON.stringify(annJson), function (err) {
                            res.end();
                        });
                        //res.send(annJson);
                    }
                });
            });                
        });
    } else res.sendStatus(400);
});

app.get('/getstrdata', isAuthenticated, function(req, res){
    var inc = req.query['inc'];
    client.get('incstr:' + inc, function(err, result){
        var jsonresult = JSON.parse(result);
        //result['participants'] = result['participants'].map(function(x) { return x.replace('incstr:', '');});
        res.send(jsonresult);
    });
});


// TODO: make sure it also works for structured data
app.get('/userstats', isAuthenticated, function(req, res){
    if (!req.query['task'] || (req.query['task']!='men' && req.query['task']!='str')) {
        res.sendStatus(400);//("Not OK: incident id not specified");
    } else {
    var user = req.user.user;
    var task = req.query['task'];
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
    if (req.body.task && req.body.incident && req.body.annotations){
        var task = req.body.task;
        var user = req.user.user;
        var rkey = task + ':' + user + ':ann:' + req.body.incident;
        logAction(req.user.user, "UPDATE ANNOTATIONS, TASK=" + task);
        client.set(rkey, JSON.stringify(req.body.annotations));
        res.sendStatus(200);
    } else {
        res.sendStatus(400);//("Not OK: incident id not specified");
        //res.send("Not OK: incident id not specified, or no documents listed");
    }
});

// TODO: check if the incident is valid
app.post('/storedisqualified', function(req, res) {
    if (req.body.task && req.body.incident){
        var task = req.body.task;
        var user = req.user.user;
        var rkey = task + ':' + user + ':dis:' + req.body.incident;
        logAction(req.user.user, "UPDATE DISQUALIFIED, TASK=" + task);
        client.set(rkey, JSON.stringify(req.body.disqualification || []));
        res.sendStatus(200);
    } else {
        res.sendStatus(400);//("Not OK: incident id not specified");
    }
});

// TODO: check if the incident is valid
app.post('/storereftexts', function(req, res) {
    if (req.body.task && req.body.incident){
        var task = req.body.task;
        var user = req.user.user;
        var rkey = task + ':' + user + ':txt:' + req.body.incident;
        logAction(req.user.user, "UPDATE REFTEXTS, TASK=" + task);
        client.set(rkey, JSON.stringify(req.body.documents || []));
        res.sendStatus(200);
    } else {
        res.sendStatus(400);//("Not OK: incident id not specified");
    }
});

app.post('/loadannotations', function(req, res){
    if (req.body.incident && req.body.task){
        var task = req.body.task;
        var user = req.user.user;
        var rkey = task + ':' + user + ':ann:' + req.body.incident;
        client.get(rkey, function(err, data){ 
            if (!err) res.send(JSON.parse(data));
        });
    } else {
        res.sendStatus(400);//"Not OK: incident id not specified");
    }
});

app.post('/loaddisqualified', function(req, res){
    if (req.body.incident && req.body.task){
        var task = req.body.task;
        var user = req.user.user;
        var rkey = task + ':' + user + ':dis:' + req.body.incident;
        client.get(rkey, function(err, data){
            if (!err) res.send(JSON.parse(data));
        });
    } else {
        res.sendStatus(400);//("Not OK: incident id not specified");
    }
});

app.post('/loadreftexts', function(req, res){
    if (req.body.incident && req.body.task){
        var task = req.body.task;
        var user = req.user.user;
        var rkey = task + ':' + user + ':txt:' + req.body.incident;
        client.get(rkey, function(err, data){
            if (!err) res.send(JSON.parse(data));
        });
    } else {
        res.sendStatus(400);//("Not OK: incident id not specified");
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

var logAction = function(u, action) {
    var d = new Date();
    d.setTime( d.getTime() + 2*60*60*1000 );
    var n = d.toISOString();
    fs.appendFile('client/logs/' + u + '.txt', action + '\t' + n + '\n', function (err){
    });
}

/* Handle Login POST */
app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/' }),
  function(req, res) {
    //res.redirect('/dash');
    logAction(req.user.user, "LOGIN");
    res.sendStatus(200);
  });

// =====================================
// LOGOUT ==============================
// =====================================
app.get('/logout', function(req, res) {
    logAction(req.user.user, "LOGOUT");
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

