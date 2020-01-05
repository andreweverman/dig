var path = require('path')
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var models = require(path.resolve('./models/dig_db'))(mongoose);

var service_util = require('./service_util');
var ensureAuthenticated = service_util.ensureAuthenticated;
var service_name = "Dig";


const config = require(path.resolve("./config") + '/config.json');
var spotify_web_api = require('spotify-web-api-node');


router.get('/', ensureAuthenticated, function (req, res) {

    let playlists = "";
    let spotify_api = new spotify_web_api(config);

    spotify_api.setAccessToken(req.user.access_token);
    spotify_api.getUserPlaylists(req.user.username)
        .then(function (data) {
            playlists = data.body.items;
            res.render('enable_dig.ejs', { user: req.user, playlists: playlists });
        }, function (err) {
            console.log('Something went wrong!', err);
        });

});

router.post('/', ensureAuthenticated, function (req, res) {

    if (req.body.dig_id) { // set the variables in mongoose for the dig
        models.Dig.findOrCreate({ user_id: req.user.user_id }, function (err, dig) {

            // editing new user
            if (!dig.dig_id) {
                dig.user_id = req.user.user_id;
                // arbitrary date that is too far back intentionally
                dig.last_run = new Date("1998-07-12T16:00:00Z");
            }
    
            dig.dig_id = req.body.dig_id;

            service_util.add_service_to_user(service_name, req.user.user_id);

            // saving user changes
            dig.save(err, dig => {
                if (err) return console.error(err);
            });
        });

        res.redirect('/');

    }
    else if (req.body.new_playlist_name) {
        // user is creating a playlist

        let dig_playlist_name = req.body.new_playlist_name;

        let j = 0;

        res.redirect('/');
    }




});





module.exports = router;