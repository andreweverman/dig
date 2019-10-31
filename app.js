// setup 
const path = require('path');
const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const config = require('./bin/config.json');

var spotifyApi = new SpotifyWebApi(config);
var spotifyAccessCodes = {};
var app = express();

// home route. show login page
app.get('/', function (req, res) {
    home_html = path.join(__dirname + '/views/home.html');
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

    spotifyApi
        .authorizationCodeGrant(authorizationCode)
        .then(function (data) {
            console.log('Retrieved access token', data.body['access_token']);
       
            // Set the access token
            spotifyApi.setAccessToken(data.body['access_token']);

            // Use the access token to retrieve information about the user connected to it
            return spotifyApi.getMe();
        })
        .then(function (data) {
            // we want to save the access code that was given and the id of who it belongs to 
            spotifyAccessCodes[data.body['uri'].split(":")[2]] = authorizationCode;
            res.redirect("/user/" + data.body['uri'].split(":")[2]);

        })
        .catch(function (err) {
            console.log('Something went wrong', err.message);
        });


});

// user home page
app.get('/user/:userUri', function (req, res) {
    var user_html = path.join(__dirname + '/views/user.html');    
    res.sendFile(user_html);    
    // res.write(JSON.stringify(req.params));
    // res.send(spotifyApi.getMe().then);

});


// localhost: 8080
app.listen(8080, () => {
    console.log("Running");
});