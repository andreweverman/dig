var spotify_web_api = require('spotify-web-api-node');
var mongoose = require('mongoose')
const config = require('./bin/config.json');
var models = require('./dig_db')(mongoose);




// from the scheduler
// will go and look in the mongodb for all users who will want to have dig run for them
// pass these users on to the dig function below
function run_dig() {

    models.Dig.find().exec(function (err, digs) {
        if (err) throw err;

        digs.forEach(member => {
            models.User.findOne({ user_id: member.user_id }).exec(function (err, user) {
                if (err) throw err;

                user_dig = new Dig(member.user_id, member.dig_id, member.dug_id, member.last_run, user.access_token);
                user_dig.dig();
            });
        });

        console.log("Done")

    });

}

class Dig {
    constructor(user_id, dig_id, dug_id, last_run, access_token) {
        // setting needed variables
        this.user_id = user_id;
        this.dig_id = dig_id;
        this.dug_id = dug_id;
        this.access_token = access_token;
        this.last_run = last_run


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
        
        // return this.last_run < this.dig_tracks[0]

    }


    add_dig() {

       
    }

    async get_necessary() {
        await Promise.all([
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
            this.saved_albums = result[1];
            this.dig_tracks = result[2];

        });
    }


}



module.exports = run_dig;