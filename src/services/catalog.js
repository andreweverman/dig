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

                if (user) { new Catalog(member.user_id, member.username, member.dig_id, member.last_run, user.access_token, user, catalogs) }

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
    constructor(user_id, username, catalog_id, last_run, access_token, user_db, dig_db) {
        // setting needed variables
        this.user_id = user_id;
        this.username = username;
        this.catalog_id = catalog_id;
        this.access_token = access_token;
        this.last_run = last_run;

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

        this.check_run() ? this.add_dig() : this.trim_tracks();

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
        return this.last_run < new Date(this.saved_tracks[0].added_at) || this.dig_tracks.length == 0;
    }

    /*  
     * Gets the difference between current time and @track_added
     *
     * Difference is the amount of days they are different. Absolute value. 
     * 
     * @param {Object}  track_added     the date object for the track that we are comparing against
     * 
     * @return {int}    The difference in days
     */
    diff(track_added) {
        const oneDay = 24 * 60 * 60 * 1000;

        let current_time = new Date();

        return Math.round(Math.abs((current_time - track_added) / oneDay));

    }


    /*
     * Removes tracks from dig that are stale.
     *
     * Looks for the tracks that are ready to be removed.
     * By default it will remove any track that has been in the playlist for a week,
     * but it won't remove to be less than 20 tracks total.
     *  

     */
    trim_tracks() {
        var dig = this;
        let length_min = 20;

        // this.dig_tracks is the most current dig iteration
        let stale_tracks = this.tracks_past_date();

        if (stale_tracks.length != 0 && this.dig_tracks.length > length_min) {

            let remove_tracks = stale_tracks.slice(0, this.dig_tracks.length - length_min);
            let remove_uris = remove_tracks.map(track => { return { uri: track.track.uri } });
            console.log('[' + service_name + ']: I think I should trim trim!');
            console.log('[' + service_name + ']: Tracks ' + remove_uris.toString());
            this.spotify_api.removeTracksFromPlaylist(this.dig_id, remove_uris).then(function (data) {
                console.log('[' + service_name + ']:\tSuccessful trim!');
            }, function (err) {
                console.log('[' + service_name + ']:\tError trimming tracks for user: ' + dig.user_id, err);
            });
        }
    }

    /*
     * Gets the tracks that are past due date. 
     *
     * Gives an array for the tracks that are past due date. Right now time limit is set for a week,
     * but we could make that an optional parameter at some poing
     * 
     * @return {Array} Array of track uris that are the tracks that are past due date
     */
    tracks_past_date() {
        let expiration = 7;
        let stale_tracks = [];

        // sorts the oldest to the front
        let old_first_dig_tracks = this.dig_tracks;
        old_first_dig_tracks.forEach((track, i) => track.order = i);
        old_first_dig_tracks.sort((a, b) => (a.added_at > b.added_at) ? 1 : (a.order > b.order) ? -1 : 1)

        old_first_dig_tracks.forEach(track => {
            let time_diff = this.diff(new Date(track.added_at))
            if (time_diff > expiration) {
                stale_tracks.push(track)
            }
        });

        return stale_tracks;
    }

    /*
     * Adds tracks from dig that have been recently saved.
     *
     * Adds all recently saved tracks by the user to the this.dig_id playlist
     * 
     */
    add_dig() {

        var new_saved_tracks = this.new_saved_tracks();
        var dig = this;

        if (new_saved_tracks.length == 0) return;

        this.spotify_api.addTracksToPlaylist(this.dig_id, new_saved_tracks, { position: 0 }).then(function (data) {

            // we will write that we ran dig at this point. most important thing is that the tracks were added. 
            models.Catalog.findOne({ user_id: dig.user_id }).exec(function (err, user) {
                if (err) throw err;

                user.last_run = new Date();
                user.save(err, user => {
                    if (err) return console.error(err);
                });

                // adding the tracks onto the dig.dig_tracks so i can skip a call to spotify. !!
                let new_tracks = dig.saved_tracks.slice(0, new_saved_tracks.length)
                dig.dig_tracks = new_tracks.concat(dig.dig_tracks);



                // now that the tracks have been updated, time to trim. 
                dig.trim_tracks();            });



        }, function (err) {
            console.log('[' + service_name + ']: Error adding tracks for user: ' + dig.user_id, err);
        });

    }


    /*
    * Gets the necessary variables to perform using dig and starts dig when done. 
    *
    * Eventually I would like to change this so I have more inline calls, but since this runs well and quickly 
    * this is what I will use for now. 
    */
    get_necessary() {

        Promise.all([
            this.spotify_api.getMySavedTracks({
                limit: 50,
                offset: 0
            }),
            this.spotify_api.getPlaylistTracks(this.dig_id),
            this.spotify_api.getUserPlaylists(this.user_id)
        ]).then(result => {

            this.saved_tracks = result[0].body.items;
            this.dig_full = result[1].body;
            this.dig_tracks = result[1].body.items;
            this.user_playlists = result[2].body.items;

            // checking for if the dig playlist is not really in the user's playlists;
            if (this.user_playlists.some(playlist => playlist.id == this.dig_id)) {
                this.dig();
                console.log("[" + service_name + "]:\tCatalog finished for user: " + this.user_id);
            }
            else {
                console.log("[" + service_name + "]:\t" + " Playlist was not found for user: " + this.user_id)
                console.log("[" + service_name + "]:\t", "Deleting this Catalog");

                // delete from digs
                models.Catalog.deleteOne({ user_id: this.user_id }, err => { err ? console.log("Error deleting") : console.log("[" + service_name + "]:\t", "Deleted") });
                // delete from user's services
                models.User.findOne({ user_id: this.user_id }).exec((err, user) => {

                    user.services = user.services.filter(service => service != service_name);
                    user.save(err, user => { if (err) return console.error(err); });
                });
            }


        }).catch(error => {
            if (error.message == "Not Found") {
                console.log("[" + service_name + "]:\t" + " Playlist was not found for user: " + this.user_id)
                console.log("[" + service_name + "]:\t", "Deleting this Catalog");

                // delete from digs
                models.Catalog.deleteOne({ user_id: this.user_id }, err => { err ? console.log("Error deleting") : console.log("[" + service_name + "]:\t", "Deleted") });
                // delete from user's services
                models.Catalog.findOne({ user_id: this.user_id }).exec((err, user) => {

                    user.services = user.services.filter(service => service != service_name);
                    user.save(err, user => { if (err) return console.error(err); });
                });

            }
            else {
                console.error("[" + service_name + "]:\tError getting info from spotify " + error);

            }

        });
    }
}



module.exports = run_catalog;