/**
 * Runs Catalog for the users that have signed up for it.
 *
 * Catalog will add the most recently saved tracks to the playlist specified by the user
 * It will also remove any tracks that have been in there for a week, keeping a minimum of 20 tracks
 * There is also an option to have it automatically sort the tracks by album. 
 *
 * @file   This file runs Catalog for each user. 
 * @author Andrew Everman.
 * @since  1.2.2020
 */

var path = require("path");
const config = require(path.resolve("./config") + '/config.json');
var spotify_web_api = require('spotify-web-api-node');
var mongoose = require('mongoose');
var models = require('../../models/dig_db')(mongoose);
var service_name = "Catalog";

/*  
* The outer most function for running Catalog. 
*
* This is called from the scheduler to run Catalog for all of the users.
* Looks through the Catalog collection and then runs dig on each user. 
* 
*/
function run_catalog() {

    models.Catalog.find().exec(function (err, catalogs) {
        if (err) throw err;

        catalogs.forEach(member => {
            models.User.findOne({ user_id: member.user_id }).exec(function (err, user) {
                if (err) throw err;

                if (user) { new Catalog(member.user_id, member.username, member.catalog_id, member.dw_id, member.initial_run, user.access_token, user, catalogs) }

            });
        });
    });
}

class Catalog {

    /*  
     * The constructor for a dig service execution
     *
     * Each class made of this will get info from the db that is necessary.
     * Then it will get the spotify info that is necessary
     * Then Catalog is run on the user.
     * 
     * @constructs  Catalog
     * 
     * @param {String}      user_id         The spotfy user_id for the user
     * @param {String}      dig_id          The spotify playlist id for the dig playlist
     * @param {Date}        last_run        The the last time that dig was run for this user
     * @param {String}      access_token    The spotify access token that will used to make calls to spotify
TODO * @param {mongoose}    user_db         The mongoose object for the user
TODO * @param {mongoose}    dig_db          The mongoose object for the dig
     * @return {int}    The difference in days
     */
    constructor(user_id, username, catalog_id, dw_id, initial_run, access_token, user_db, dig_db) {
        // setting needed variables
        this.user_id = user_id;
        this.username = username;
        this.catalog_id = catalog_id;
        this.dw_id = dw_id;
        this.access_token = access_token;
        this.initial_run = initial_run;

        this.user_db = user_db;
        this.dig_db = dig_db;

        // setting access_token
        this.spotify_api = new spotify_web_api(config);
        this.spotify_api.setAccessToken(access_token);

        this.get_necessary();

    }

    /*  
     * Runs the dig service for the @this.user_id.
     *
     * Catalog will add the most recently saved tracks to the @this.dig_id.
     * It will also remove any tracks that have been in there for a week, keeping a minimum of 20 tracks
     * There is also an option to have it automatically sort the tracks by album. 
     * 
     * @param {Object}  track_added     the date object for the track that we are comparing against
     */
    catalog() {

        this.check_run() ? this.add_tracks() : undefined

    }


    /*  
     * Checks if dig needs to be run further for the user
     *
     * This is so that if there are no new tracks added, then we short circuit so that we can
     * save some computation. 
     * 
     * @param {Date}  this.last_run       the time that dig was last run for this user
     * 
     * @return {bool}    true for should run, false if not
     */
    check_run() {
        // going to check if the first song in the 
        let run = !this.initial_run;
        let is_monday = (new Date()).getDay() == 1;

        return run || is_monday;
    }


    /*
     * Adds tracks from dig that have been recently saved.
     *
     * Adds all recently saved tracks by the user to the this.dig_id playlist
     * 
     */
    add_tracks() {

        var new_saved_tracks = this.new_saved_tracks();
        var catalog = this;

        this.spotify_api.addTracksToPlaylist(this.catalog_id, new_saved_tracks).then(function (data) {

            if (!catalog.initial_run) {
            //     update that we have initialized the playlist
                models.Catalog.findOne({ user_id: catalog.user_id }).exec(function (err, catalog_db) {
                    if (err) throw err;

                    catalog_db.initial_run = true


                    catalog_db.save(err, user => {
                        if (err) return console.error(err);
                    });
                });

            }

        }, function (err) {
            console.log('[' + service_name + ']: Error adding tracks for user: ' + catalog.user_id, err);
        });

    }


    new_saved_tracks() {

        let tracks = this.dw_tracks;

        return tracks.map(track => track.track.uri)

    }


    /*
    * Gets the necessary variables to perform using dig and starts dig when done. 
    *
    * Eventually I would like to change this so I have more inline calls, but since this runs well and quickly 
    * this is what I will use for now. 
    */
    get_necessary() {

        Promise.all([

            this.spotify_api.getPlaylistTracks(this.catalog_id),

            this.spotify_api.getPlaylistTracks(this.dw_id)

        ]).then(result => {

            this.catalog_tracks = result[0].body.items;
            this.dw_tracks = result[1].body.items;

            this.catalog();




        }).catch(error => {


        });
    }
}



module.exports = run_catalog;