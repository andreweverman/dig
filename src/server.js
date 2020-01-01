var express = require('express'),
  session = require('express-session'),
  passport = require('passport'),
  expressLayouts = require('express-ejs-layouts'),
  SpotifyStrategy = require('passport-spotify').Strategy,
  mongoose = require('mongoose'),
  spotify_web_api = require('spotify-web-api-node'),
  request = require('request'),
  schedule = require('node-schedule'),
  path = require("path");

var dig = require("./services/dig");
var refresh = require('./refresh');

const config = require(path.resolve("./config") + '/config.json');

// mongoose setup
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(config.MONGO_URL);


var models = require('../models/dig_db')(mongoose);

// spotify setup.
var spotify_api = new spotify_web_api(config);


passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

// Use the SpotifyStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, expires_in
//   and spotify profile), and invoke a callback with a user object.
passport.use(
  new SpotifyStrategy(
    config,
    function (access_token, refresh_token, expires_in, profile, done) {
      // asynchronous verification, for effect...
      process.nextTick(function () {
        // To keep the example simple, the user's spotify profile is returned to
        // represent the logged-in user. In a typical application, you would want
        // to associate the spotify account with a user record in your database,
        // and return that user instead.

        // gets the user based off id.
        models.User.findOrCreate({ user_id: profile.id }, function (err, user) {
          user.display_name = profile.displayName;
          user.username = profile.username;
          user.photo = profile.photos[0];
          user.access_token = access_token;
          user.refresh_token = refresh_token;

          // saving user changes
          user.save(err, user => {
            if (err) return console.error(err);
          });


          return done(err, user);
        });
      });
    })
);


var app = express();

// configure Express
app.set('views', path.resolve("./views"));
app.set('view engine', 'ejs');
app.use(expressLayouts);

app.use(session({ secret: 'aunt jemima', resave: true, saveUninitialized: true }));
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());
// app.use(express.static(__dirname + '/public'));
app.use('/public', express.static(path.resolve("./public")));

app.use('/', require(path.resolve("./routes/home")));

app.use('/enable_dig', require(path.resolve('./routes/services/enable_dig.js')));

app.get('/refresh_token', ensureAuthenticated, function (req, res) {
  // requesting access token from refresh token
  let refresh_token = req.user.refresh_token;
  let client_id = config.clientID;
  let client_secret = config.clientSecret;

  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;

      res.send({
        'access_token': access_token
      });

      // need to save the updated access_token in the mongo_db
      models.User.findOrCreate({ user_id: req.user.user_id }, function (err, user) {
        user.access_token = access_token;

        // saving user changes
        user.save(err, user => {
          if (err) return console.error(err);
        });

      });
    }
  });
});


app.get('/account', ensureAuthenticated, function (req, res) {
  res.render('account.ejs', { user: req.user });
});

app.get('/login', function (req, res) {
  res.render('login.ejs', { user: req.user });
});




// GET /auth/spotify
//   Use passport.authenticate() as route middleware to authenticate the
//   request. The first step in spotify authentication will involve redirecting
//   the user to spotify.com. After authorization, spotify will redirect the user
//   back to this application at /auth/spotify/callback
app.get(
  '/auth/spotify',
  passport.authenticate('spotify', {
    scope: config.scope,
    showDialog: true
  }),
  function (req, res) {
    // The request will be redirected to spotify for authentication, so this
    // function will not be called.
  }
);

// GET /auth/spotify/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request. If authentication fails, the user will be redirected back to the
//   login page. Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get(
  '/callback',
  passport.authenticate('spotify', { failureRedirect: '/login' }),
  function (req, res) {
    res.redirect('/');
  }
);

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

app.listen(8080);

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed. Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}


// run dig every 5 minutes
refresh();
var refresh_schedule = schedule.scheduleJob('*/30 * * * *', refresh);


// run dig every 5 minutes
dig();
var dig_schedule = schedule.scheduleJob('*/5 * * * *', dig);




