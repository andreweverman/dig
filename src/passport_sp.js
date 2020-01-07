// Sets up a the passport object that we will use in the server.
// This is just to help clean up some of the mess from the server.js file
// Also use for exporting the ensureAuthenticated function for the other routes


var path = require('path');
var mongoose = require('mongoose');
const config = require(path.resolve("./config") + '/config.json');
var passport = require('passport'),
    SpotifyStrategy = require('passport-spotify').Strategy;

var models = require(path.resolve('./models/dig_db'))(mongoose);

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    // so that it updates the user every time we change page !
    models.User.findOrCreate({ user_id: user.user_id }, function (err, user) {
        done(null, user);
    });



});

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

module.exports = {

    ensureAuthenticated: ensureAuthenticated,
    passport: passport


}