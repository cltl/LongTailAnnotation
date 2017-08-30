var express = require('express');
var app = express();
var request = require('request');
var fs = require('fs');
var LocalStrategy = require('passport-local').Strategy
var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var passport = require('passport');
var expressSession = require('express-session');

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
    res.sendFile('dash.html', {root:'./client'});
});

app.get('/mentions', isAuthenticated, function(req, res){
    res.sendFile('mentions.html', {root:'./client'});
});

app.get('/structured', isAuthenticated, function(req, res){
    res.sendFile('structured.html', {root:'./client'});
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    if (username=='filip' && password=='filip'){
   done(null, { user: username });
  }
  else
  {
    done(null, false);
  }
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

/* Handle Logout */
app.get('/signout', function(req, res) {
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

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.listen(8686, function() {
	console.log('started annotation tool nodejs backend');
});

module.exports = app;

