/**
 * Runs Album Save Tracks for the users that have signed up for it.
 *
 * If user saves an album , will save each individual track in the album.
 *
 * @file   This file runs Dug for each user. 
 * @author Andrew Everman.
 * @since  4.23.2020
 */

var path = require("path");
const config = require(path.resolve("./config") + '/config.json');
var spotify_web_api = require('spotify-web-api-node');
var mongoose = require('mongoose');
var models = require('../../models/dig_db')(mongoose);
var service_name = "Album Save Tracks"

/*  
* The outer most function for running Dug. 
*
* This is called from the scheduler to run Dug for all of the users.
* Looks through the Dug collection and then runs dig on each user. 
* 
*/
function run_album_save_tracks() {

    models.AlbumSaveTracks.find().exec(function (err, asts) {
        if (err) throw err;

        asts.forEach(member => {
            models.User.findOne({ user_id: member.user_id }).exec(function (err, user) {
                if (err) throw err;

                if (user) { new AlbumSaveTracks(member.user_id, member.last_run, user.access_token, user, asts); }

            });
        });



    });

}

class AlbumSaveTracks {

    /*  
     * The constructor for a dig service execution
     *
     * Each class made of this will get info from the db that is necessary.
     * Then it will get the spotify info that is necessary
     * Then Dug is run on the user.
     * 
     * @constructs  Dug
     * 
     * @param {String}      user_id         The spotfy user_id for the user
     * @param {Date}        last_run        The the last time that dig was run for this user
     * @param {String}      access_token    The spotify access token that will used to make calls to spotify
TODO * @param {mongoose}    user_db         The mongoose object for the user
TODO * @param {mongoose}    ast_db          The mongoose object for the ast
     * @return {int}    The difference in days
     */
    constructor(user_id, last_run, access_token, user_db, ast_db) {
        // setting needed variables
        this.user_id = user_id;
        this.access_token = access_token;
        this.last_run = last_run;

        this.user_db = user_db;
        this.ast_db = ast_db;

        // setting access_token
        this.spotify_api = new spotify_web_api(config);
        this.spotify_api.setAccessToken(access_token);

        this.get_necessary();

    }

    /*
     * Adds tracks from dig that have been recently saved.
     *
     * Adds all recently saved tracks by the user to the this.dig_id playlist
     * 
     */
    album_save_tracks() {


        let album_uri_container = []

        for (let i = 0; i < this.saved_albums.length; i++) {
            let album = this.saved_albums[i]

            if (this.last_run > new Date(album.added_at)) {
                break;
            }
            else {

                album_uri_container.push(album.album.tracks.items.map(x => x.id));

            }
        }


        Promise.all(album_uri_container.map(x => this.spotify_api.containsMySavedTracks(x))
        ).then(result => {
            let add_uris = [];
            for (let i = 0; i < result.length; i++) {
                let result_arr = result[i].body;
                let track_uri_arr = album_uri_container[i];

                let zzz = track_uri_arr.filter((x, i) => !result_arr[i]).reverse()

                add_uris = add_uris.concat(zzz);


            }
            let uri_container = []
            var i, j, max_size = 50;
            for (i = 0, j = add_uris.length; i < j; i += max_size) {
                uri_container.push(add_uris.slice(i, i + max_size))
            }
            
            if (add_uris.length ==0)return;

            Promise.all(uri_container.map(x => this.spotify_api.addToMySavedTracks(x))
            ).then(result => {
                models.AlbumSaveTracks.findOne({ user_id: this.user_id }).exec(function (err, user) {
                    if (err) throw err;

                    user.last_run = new Date();
                    user.save(err, user => {
                        if (err) return console.error(err);
                    });

                });


            }).catch(err => console.error(err));


        }).catch(error => console.error(error))
 



    }



    /*
    * Gets the necessary variables to perform using dig and starts dig when done. 
    *
    * Eventually I would like to change this so I have more inline calls, but since this runs well and quickly 
    * this is what I will use for now. 
    */
    get_necessary() {

        Promise.all([
            this.spotify_api.getMySavedAlbums({
                limit: 50,
                offset: 0
            }),
        ]).then(result => {

            this.saved_albums = result[0].body.items;


            this.album_save_tracks();
            console.log("[" + service_name + "]:\t\tDug finished for user:", this.user_id);
        }).catch(error => {
            console.error("[" + service_name + "]:\t\tError getting info from spotify ", error)
        });


    }
}



module.exports = run_album_save_tracks;