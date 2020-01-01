var path = require('path');
const config = require(path.resolve("./config") + '/config.json');
var express = require('express');
var router = express.Router();

var passport_sp = require(path.resolve('./src/passport_sp.js'));
var passport = passport_sp.passport;



// GET /auth/spotify
//   Use passport.authenticate() as route middleware to authenticate the
//   request. The first step in spotify authentication will involve redirecting
//   the user to spotify.com. After authorization, spotify will redirect the user
//   back to this application at /auth/spotify/callback
router.get(
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
router.get(
    '/callback',
    passport.authenticate('spotify', { failureRedirect: '/login' }),
    function (req, res) {
        res.redirect('/');
    }
);



module.exports = router;