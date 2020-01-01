// This code is what runs the dig the users access tokens fresh for use constantly
// This is used at the bottom of the server file

// "Dig" is taking the recently saved tracks and making a small playlist of just those tracks

var path = require("path");
const config = require(path.resolve("./config") + '/config.json');
var spotify_web_api = require('spotify-web-api-node');
var mongoose = require('mongoose');
var models = require('../../models/dig_db')(mongoose);

// from the scheduler
// will go and look in the mongodb for all users who will want to have dig run for them
// pass these users on to the dig function below
function run_dig() {

    models.Dig.find().exec(function (err, digs) {
        if (err) throw err;

        digs.forEach(member => {
            models.User.findOne({ user_id: member.user_id }).exec(function (err, user) {
                if (err) throw err;

                new Dig(member.user_id, member.dig_id, member.dug_id, member.last_run, user.access_token, user, digs);

            });
        });

        console.log("Done Digging");

    });

}

class Dig {
    constructor(user_id, dig_id, dug_id, last_run, access_token, user_db, dig_db) {
        // setting needed variables
        this.user_id = user_id;
        this.dig_id = dig_id;
        this.dug_id = dug_id;
        this.access_token = access_token;
        this.last_run = last_run

        this.user_db = user_db;
        this.dig_db = dig_db;


        // setting access_token
        this.spotify_api = new spotify_web_api(config);
        this.spotify_api.setAccessToken(access_token);

        this.get_necessary();


    }

    // whole operation runs out of here. first we will check if need to run
    dig() {

        // TODO: add the album save all tracks functionality

        // check if there is something new that would mean we should add to dig

        if (this.check_run()) {
            // TODO: add to dig
            this.add_dig();

            // TODO: add to dug

            // TODO: sort dig by album. make optional user parameter

            // TODO:  write that we ran dig in user
        }


        // TODO: trim tracks from dig

    }

    check_run() {
        return this.last_run < new Date(this.saved_tracks[0].added_at);
    }


    diff(track_added) {
        const oneDay = 24 * 60 * 60 * 1000;

        let current_time = new Date();

        return Math.round(Math.abs((current_time - track_added) / oneDay));

    }


    add_dig() {

        let new_saved_tracks = this.new_saved_tracks();
        var dig = this;


        this.spotify_api.addTracksToPlaylist(this.dig_id, new_saved_tracks, { position: 0 }).then(function (data) {

            models.Dig.findOne({ user_id: dig.user_id }).exec(function (err, user) {
                if (err) throw err;

                user.last_run = new Date();
                user.save(err, user => {
                    if (err) return console.error(err);
                });

            });

        }, function (err) {
            console.log('Something went wrong!', err);
        });


    }

    new_saved_tracks() {

        let stop = this.saved_tracks.length;
        let new_tracks = []

        for (let i = 0; i < this.saved_tracks.length; i++) {
            let track = this.saved_tracks[i]

            if (this.last_run > new Date(track.added_at)) {

                break;
            }
            else {
                new_tracks.push(track.track.uri)
            }
        }

        return new_tracks;
    }

    get_necessary() {

        Promise.all([
            this.spotify_api.getMySavedTracks({
                limit: 50,
                offset: 0
            }),
            this.spotify_api.getMySavedAlbums({
                limit: 10,
                offset: 0
            }),
            this.spotify_api.getPlaylistTracks(this.dig_id)
        ]).then(result => {

            this.saved_tracks = result[0].body.items;
            this.saved_albums = result[1].body.items;
            this.dig_tracks = result[2].body.items;

            this.dig();
        }).catch(error => {
            console.error("Dig: ", error)
        });
    }
}



module.exports = run_dig;