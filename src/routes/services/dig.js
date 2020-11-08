var path = require('path')
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var models = require(path.resolve('./models/dig_db'))(mongoose);

var service_util = require('./util/service_util');
var ensureAuthenticated = service_util.ensureAuthenticated;
var service_name = "Dig";


const config = require(path.resolve("./config") + '/config.json');
var spotify_web_api = require('spotify-web-api-node');


router.get('/enable', ensureAuthenticated, function (req, res) {

    let playlists = "";
    let spotify_api = new spotify_web_api(config);

    spotify_api.setAccessToken(req.user.access_token);
    spotify_api.getUserPlaylists(req.user.user_id)
        .then(function (data) {
            // need to filter out only the playlists that the users own
            // item[0].owner.id  
            let playlists = data.body.items;
            let editable_playlists = playlists.filter((playlist) => {
                let z = playlist.owner.id;
                return playlist.owner.id == req.user.user_id
            });

            res.render('services/dig/enable_dig.ejs', { user: req.user, playlists: editable_playlists });
        }, function (err) {
            console.log('Something went wrong!', err);
        });

});

// handles the enabling of dig. only good input can get to this point
router.put('/enable/existing_playlist', ensureAuthenticated, function (req, res) {
    let user = req.user;

    if (req.body.dig_id) { // set the variables in mongoose for the dig
        models.Dig.findOrCreate({ user_id: user.user_id }, function (err, dig) {

            // editing new user
            if (!dig.dig_id) {
                dig.user_id = user.user_id;
                // arbitrary date that is too far back intentionally
                dig.last_run = new Date("1998-07-12T16:00:00Z");
            }

            dig.dig_id = req.body.dig_id;

            service_util.add_service_to_user(service_name, user.user_id);

            // saving user changes
            dig.save(err, dig => {
                if (err) return console.error(err);

            });
            res.redirect(200, '/');
        });

    }

});


// handles the enabling of dig. only good input can get to this point
router.put('/enable/new_playlist', ensureAuthenticated, function (req, res) {

    // user is creating a playlist
    let user = req.user;
    let dig_playlist_name = req.body.new_playlist_name;

    let spotify_api = new spotify_web_api(config);
    spotify_api.setAccessToken(req.user.access_token);

    spotify_api.createPlaylist(user.user_id, dig_playlist_name, { 'description': "Playlist created to hold recently saved tracks. ", 'public': false, 'collaborative': false }).then(data => {

        // need to add to dig db

        models.Dig.findOrCreate({ user_id: user.user_id }, function (err, dig) {

            // editing new user
            if (!dig.dig_id) {
                dig.user_id = user.user_id;
                // arbitrary date that is too far back intentionally
                dig.last_run = new Date("1998-07-12T16:00:00Z");
            }

            dig.dig_id = data.body.id;

            service_util.add_service_to_user(service_name, user.user_id);

            // saving user changes
            dig.save(err, dig => {
                if (err) return console.error(err);
            });

            res.redirect(200, '/');
        });
    });
});


router.delete('/disable', ensureAuthenticated, function (req, res) {
    let user = req.user;
    // delete from digs
    models.Dig.deleteOne({ user_id: user.user_id }, err => { err ? console.log("Error deleting") : console.log("[" + service_name + "]:\t\t", "Deleted") });
    // delete from user's services
    models.User.findOne({ user_id: user.user_id }).exec((err, user) => {

        user.services = user.services.filter(service => service != service_name);
        user.save(err, user => { if (err) return console.error(err); });
        res.redirect(200, '/');
    });
});


module.exports = router;