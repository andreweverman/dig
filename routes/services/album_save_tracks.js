var path = require('path')
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var models = require(path.resolve('./models/dig_db'))(mongoose);

var service_util = require('./util/service_util');
var ensureAuthenticated = service_util.ensureAuthenticated;
var service_name = "Album Save Tracks";


const config = require(path.resolve("./config") + '/config.json');
var spotify_web_api = require('spotify-web-api-node');


// handles the enabling of dcatalogug. only good input can get to this point
router.put('/toggle', ensureAuthenticated, function (req, res) {

    // user is creating a playlist
    let user = req.user;


    models.AlbumSaveTracks.findOrCreate({ user_id: user.user_id }, function (err, save_tracks) {

        if (save_tracks.enabled ==undefined) save_tracks.last_run = new Date("1998-07-12T16:00:00Z");
        const enabled = !save_tracks.enabled;
        save_tracks.enabled = enabled;
        

        // saving user changes
        save_tracks.save(err, save_tracks => {
            if (err) return console.error(err);
        });


        models.User.findOne({ user_id: user.user_id }).exec((err, user) => {
            if (!enabled) {
                user.services = user.services.filter(service => service != service_name);
            }else{
                service_util.add_service_to_user(service_name, user.user_id);
            }

            user.save(err, user => { if (err) return console.error(err); });
            res.redirect(200, '/');
        });


    });

});







module.exports = router;