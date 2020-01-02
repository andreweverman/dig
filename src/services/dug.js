/**
 * Runs Dug for the users that have signed up for it.
 *
 * Dug will add the most recently saved tracks to the playlist specified by the user.
 * Not really needed now because they have a list, but I like to do it anyways
 *
 * @file   This file runs Dug for each user. 
 * @author Andrew Everman.
 * @since  1.2.2020
 */

var path = require("path");
const config = require(path.resolve("./config") + '/config.json');
var spotify_web_api = require('spotify-web-api-node');
var mongoose = require('mongoose');
var models = require('../../models/dig_db')(mongoose);

/*  
* The outer most function for running Dug. 
*
* This is called from the scheduler to run Dug for all of the users.
* Looks through the Dug collection and then runs dig on each user. 
* 
*/
function run_dug() {

    models.Dug.find().exec(function (err, dugs) {
        if (err) throw err;

        dugs.forEach(member => {
            models.User.findOne({ user_id: member.user_id }).exec(function (err, user) {
                if (err) throw err;

                new Dug(member.user_id, member.dug_id, member.last_run, user.access_token, user, dugs);

            });
        });



    });

}

class Dug {

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
     * @param {String}      dug_id          The spotify playlist id for the dug playlist
     * @param {Date}        last_run        The the last time that dig was run for this user
     * @param {String}      access_token    The spotify access token that will used to make calls to spotify
TODO * @param {mongoose}    user_db         The mongoose object for the user
TODO * @param {mongoose}    dug_db          The mongoose object for the dig
     * @return {int}    The difference in days
     */
    constructor(user_id, dug_id, last_run, access_token, user_db, dug_db) {
        // setting needed variables
        this.user_id = user_id;
        this.dug_id = dug_id;
        this.access_token = access_token;
        this.last_run = last_run

        this.user_db = user_db;
        this.dug_db = dug_db;

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
    dug() {

        var new_saved_tracks = this.new_saved_tracks();
        var dug = this;


        this.spotify_api.addTracksToPlaylist(this.dug_id, new_saved_tracks, { position: 0 }).then(function (data) {

            // we will write that we ran dig at this point. most important thing is that the tracks were added. 
            models.Dug.findOne({ user_id: dug.user_id }).exec(function (err, user) {
                if (err) throw err;

                user.last_run = new Date();
                user.save(err, user => {
                    if (err) return console.error(err);
                });
               
            });



        }, function (err) {
            console.log('[Dig]: Error adding tracks for user: ' + dug.user_id, err);
        });


    }

    /*
     * Gets the recently saved tracks from the user. 
     *
     * Looks in the user's saved tracks and then only grabs the new ones. This is determined by comparing the save
     * date to the last run date in the db for that user. 
     * 
     * @return {String} An array of the track uri's that need to be saved.     
     */
    new_saved_tracks() {

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
            this.spotify_api.getPlaylistTracks(this.dug_id)
        ]).then(result => {

            this.saved_tracks = result[0].body.items;
            this.dug_tracks = result[1].body.items;

            this.dug();
            console.log("[Dug]:\t\tDug finished for a user");
        }).catch(error => {
            console.error("[Dug]:\t\tError getting info from spotify ", error)
        });


    }
}



module.exports = run_dug;