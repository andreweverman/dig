var path = require('path')
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var models = require(path.resolve('./models/dig_db'))(mongoose);

const config = require(path.resolve("./config") + '/config.json');
var spotify_web_api = require('spotify-web-api-node');


router.get('/', ensureAuthenticated, function (req, res) {

    let playlists = "";
    let spotify_api = new spotify_web_api(config);

    spotify_api.setAccessToken(req.user.access_token);
    spotify_api.getUserPlaylists(req.user.username)
        .then(function (data) {
            playlists = data.body.items;
            res.render('enable_dug.ejs', { user: req.user, playlists: playlists });
        }, function (err) {
            console.log('Something went wrong!', err);
        });

});

router.get('/valid', ensureAuthenticated, function (req, res) {

    // set the variables in mongoose for the dig and optional master
    models.Dug.findOrCreate({ user_id: req.user.user_id }, function (err, dug) {

        dug.user_id = req.user.user_id;       
        dug.dug_id = req.query.dug_id;

        // arbitrary date that is too far back intentionally
        dug.last_run = new Date("1998-07-12T16:00:00Z");

        models.User.findOrCreate({ user_id: req.user.user_id }, function (err, user) {
            let in_services = user.services.includes("dig")
            if (!in_services) {
                user.services.push("dig");
                user.save(err, user => {
                    if (err) return console.error(err);
                });
            }

        });

        // saving user changes
        dug.save(err, dig => {
            if (err) return console.error(err);
        });
    });

    res.redirect('/');

});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}



module.exports = router;