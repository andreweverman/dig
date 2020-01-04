/**
 * Holds common operations between services
 *
 * This file will hold some commun functions that will be used. 
 * EX. Adding the service to the user's db when they sign up
 *
 * @file   This file holds functions for services to use 
 * @author Andrew Everman.
 * @since  1.3.2020
 */

var path = require("path");
const config = require(path.resolve("./config") + '/config.json');
var spotify_web_api = require('spotify-web-api-node');
var mongoose = require('mongoose');
var models = require('../../models/dig_db')(mongoose);


/*  
 * Adds current service to the user's profile.
 *
 * Adds the current service to the mongodb for the user.
 * Need to check that it already isn't in there too ?
 * 
 * @param {string}  service_name     the name of the service we will be adding into the db
 */
function add_service_to_user(service_name, user_id) {


    models.User.findOrCreate({ user_id: user_id }, function (err, user) {
        let in_services = user.services.includes(service_name)
        if (!in_services) {
            user.services.push(service_name);

            // sorting them for better look
            user.services.sort((a, b) => (a > b) ? 1 :0)

            user.save(err, user => {
                if (err) return console.error(err);
            });
        }
    });

}


function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}



module.exports = {

    add_service_to_user: add_service_to_user,
    ensureAuthenticated: ensureAuthenticated


}