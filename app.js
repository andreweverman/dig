// setup
//  requires
const path = require('path');
const fs = require('fs');
const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const config = require('./bin/config.json');
const sqlite3 = require('sqlite3').verbose();

// const vars not requires
const views = path.join(__dirname + '/views/');
const db_path = "bin/digdb.db";


// getting objects
var spotifyApi = new SpotifyWebApi(config);
var spotifyAccessCodes = {};
var app = express();
app.engine('html', require('ejs').renderFile);
var db = getDB();


function getDB() {
    var db = null;
    // TODO: have a function that looks for the db file. if not we will ahve some create lines and shiiii
    // setting up the database

    // need to check if the db file exists before connecting.
    // if it doesnt then we will have to create the tables
    db = new sqlite3.Database(db_path, (err) => {
        if (err) {
            console.log('Could not connect to database', err)
        }
    });


    // db.all(`SELECT * FROM USER`,(err, rows ) => {
    //     (!err) ? console.log(rows) : console.log("Need to create USER")
    // });



    // this will try to make the user table. wont error out if already there
    db.run(`CREATE TABLE USER(
        user_id text  PRIMARY KEY,
        authorization_code text, 
        access_token text,
        refresh_token text)`, (err) => {
        if (!err) {
            console.log("Created USER table")
        }
    });

    return db;
}


function userLoginDB(user_info) {
    db.all(`SELECT * FROM USER WHERE user_id = ${user_info.user_id}`, (err, rows) => {
        if (!err) {
            // if user doesn't exist it gives us a [] back

            if (rows = Array(0)) {
                db.run(`INSERT INTO USER(user_id, authorization_code,access_token,refresh_token) VALUES(?)`, [user_info.user_id, user_info.authorization_code, user_info.access_token, user_info.refresh_token], (err) => {
                    if (!err) {
                        console.log("Created USER table")
                    }
                    else {
                        console.log("ERROR: Adding user to DB")
                    }
                });


            }
            else {
                console.log(rows)
            }

        } else {
            console.log("ERROR: userLoginDB db.all statement")
        }
    });

}


// home route. show login page
app.get('/', function (req, res) {
    let home_html = path.join(__dirname + '/views/home.html');
    res.sendFile(home_html);
});

// doing the login. shoves them over to spotify
app.get('/login', function (req, res) {
    var scopes = 'playlist-modify-public playlist-modify-private playlist-modify-private user-library-read user-library-modify playlist-read-private';
    var my_client_id = config.clientId;
    var redirect_uri = config.redirectUri;
    res.redirect('https://accounts.spotify.com/authorize' +
        '?response_type=code' +
        '&client_id=' + my_client_id +
        (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
        '&redirect_uri=' + encodeURIComponent(redirect_uri));
});


// after spotify login, goes here. 
app.get('/callback', function (req, res) {
    var authorizationCode = req.query.code;

    let user_info = {};

    spotifyApi
        .authorizationCodeGrant(authorizationCode)
        .then(function (data) {
            let access_token = data.body['access_token'];
            let refresh_token = data.body['refresh_token'];
            user_info.access_token = access_token;
            user_info.refresh_token = refresh_token;
            user_info.authorization_code = authorizationCode;
            // Set the access tokens
            spotifyApi.setAccessToken(access_token);
            spotifyApi.setRefreshToken(refresh_token);

            // Use the access token to retrieve information about the user connected to it
            return spotifyApi.getMe();
        })
        .then(function (data) {
            // we want to save the access code that was given and the id of who it belongs to 
            let user_id = data.body['uri'].split(":")[2]
            user_info.user_id = user_id;

            // this function will save/ update the user's credentials for use later
            userLoginDB(user_info);

            res.redirect("/user/" + user_id);

        })
        .catch(function (err) {
            console.log('Something went wrong', err.message);
        });


});

// user home page
app.get('/user/:userUri', function (req, res) {
    let user_html = views + 'user.html.ejs';

    let code = spotifyAccessCodes[req.params.userUri];



    res.render(user_html, { username: "andreweverman" });

});


// localhost: 8080
app.listen(8080, () => {
    console.log("Running");
});