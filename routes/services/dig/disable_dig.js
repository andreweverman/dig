var path = require('path')
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var models = require(path.resolve('./models/dig_db'))(mongoose);

var service_util = require('../service_util');
var ensureAuthenticated = service_util.ensureAuthenticated;
var service_name = "Dig";

const config = require(path.resolve("./config") + '/config.json');
var spotify_web_api = require('spotify-web-api-node');


router.delete('/', ensureAuthenticated, function (req, res) {
    let user = req.user;
    // delete from digs
    models.Dig.deleteOne({ user_id: user.user_id }, err => { err ? console.log("Error deleting") : console.log("[" + service_name + "]:\t\t", "Deleted") });
    // delete from user's services
    models.User.findOne({ user_id: user.user_id }).exec((err, user) => {
      
        user.services = user.services.filter(service => service != service_name);
        user.save(err, user => { if (err) return console.error(err); });
        res.redirect(200, '/');
    });
});



module.exports= router;
