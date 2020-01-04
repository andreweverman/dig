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

router.get('/valid', ensureAuthenticated, function (req, res) {

    // set the variables in mongoose for the dig and optional master
    models.Dig.findOrCreate({ user_id: req.user.user_id }, function (err, dig) {

        dig.user_id = req.user.user_id;
        dig.dig_id = req.query.dig_id;      

        // arbitrary date that is too far back intentionally
        dig.last_run = new Date("1998-07-12T16:00:00Z");


        service_util.add_service_to_user(service_name,  req.user.user_id);

        // saving user changes
        dig.save(err, dig => {
            if (err) return console.error(err);
        });
    });

    res.redirect('/');

});





module.exports = router;