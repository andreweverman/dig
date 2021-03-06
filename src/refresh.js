// This code is what keeps the users access tokens fresh for use constantly
// This is used at the bottom of the server file


var path = require("path");
const config = require(path.resolve("./config") + '/config.json');
var spotify_web_api = require('spotify-web-api-node');
var mongoose = require('mongoose');
var models = require('../models/dig_db')(mongoose);
var request = require('request');


// will go and look in the mongodb for all users who will want to have dig run for them
// pass these users on to the dig function below
function refresh_tokens() {

    models.User.find().exec(function (err, users) {
        if (err) throw err;
        users.forEach(user => {
            user_dig = new Refresh(user)
        });
    });


}


class Refresh {
    constructor(user) {
        this.refresh_token = user.refresh_token;
        this.user_id = user.user_id;

        this.refresh()

    }


    refresh() {
        var user = this;
        let refresh_token = this.refresh_token
        let client_id = config.clientID;
        let client_secret = config.clientSecret;

        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            headers: { 'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64')) },
            form: {
                grant_type: 'refresh_token',
                refresh_token: refresh_token
            },
            json: true
        };

        request.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var access_token = body.access_token;

                // need to save the updated access_token in the mongo_db
                models.User.findOrCreate({ user_id: user.user_id }, function (err, user) {
                    user.access_token = access_token;

                    // saving user changes
                    user.save(err, user => {
                        if (err) return console.error(err);
                    });

                });
            }
            console.log("[Refresh]:\tRefreshed a Token");
        });

    }
}

module.exports = refresh_tokens;