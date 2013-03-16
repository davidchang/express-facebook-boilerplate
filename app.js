var express = require('express')
  , http = require('http')
  , path = require('path')
  , redis = require('redis')
  , client = redis.createClient()
  , passport = require('passport')
  , FacebookStrategy = require('passport-facebook').Strategy
  , config = require('./config');

client.on('error', function(err) {
    console.log('redis error ' + err);
});

passport.use(new FacebookStrategy({
    clientID: config.facebook.clientID,
    clientSecret: config.facebook.clientSecret,
    callbackURL: '/auth/facebook/callback'
},
    function(accessToken, refreshToken, userData, done) {
        client.get('users', function(err, reply) {

            if(err) {
                done(err); return;
            }

            var allUsers = {};
            if(reply != null) {
                try {
                    allUsers = JSON.parse(reply);
                    if(allUsers[userData.id]) {
                        done(null, allUsers[userData.id]);
                        return;
                    }
                } catch (err) { }
            }

            allUsers[userData.id] = userData;
            
            client.set('users', JSON.stringify(allUsers), function(err, reply) {
                if(err) { done(err); return; }

                done(null, userData);   
            });
        });
    })
);

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  client.get('users', function(err, reply) {
    try {
        var allUsers = JSON.parse(reply);
        done(err, allUsers[id]);
    } catch (err) { done("could not deserialize user"); }
  });
});

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/',
    failureRedirect: '/' }));

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

app.get('/', function(req, res) {
    console.log("The req.user: " );
    console.log(req.user);

    if(req.user)
        res.render('index', { title: 'Hello ' + req.user.displayName, user: req.user });
    else
        res.render('index', { title: 'You are not yet logged in', user: req.user });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
