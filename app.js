var express = require('express'),
  session = require('express-session'),
  passport = require('passport'),
  expressLayouts = require('express-ejs-layouts'),
  SpotifyStrategy = require('passport-spotify').Strategy,
  mongoose = require('mongoose'),
  findorcreate = require('mongoose-findorcreate'),
  consolidate = require('consolidate'),
  spotify_web_api = require('spotify-web-api-node');




const config = require('./bin/config.json');

// mongoose setup

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(config.MONGO_URL);
var db = mongoose.connection;
var models = require('./dig_db')(mongoose);

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
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(expressLayouts);

app.use(session({ secret: 'aunt jemima', resave: true, saveUninitialized: true }));
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());
// app.use(express.static(__dirname + '/public'));
app.use('/public', express.static(__dirname + '/public'));


app.get('/', function (req, res) {
  res.render('index.ejs', { user: req.user });
});

app.get('/enable_dig', ensureAuthenticated, function (req, res) {

  let playlists = "";
  spotify_api.setAccessToken(req.user.access_token);
  spotify_api.getUserPlaylists(req.user.username)
    .then(function (data) {
      playlists = data.body.items;
      res.render('enable_dig.ejs', { user: req.user, playlists: playlists });
    }, function (err) {
      console.log('Something went wrong!', err);
    });

});

app.get('/enable_dig/valid', ensureAuthenticated, function (req, res) {

  // set the variables in mongoose for the dig and optional master
  
  res.redirect('/');

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
    scope: ['user-read-email', 'user-read-private', 'playlist-read-private'],
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
