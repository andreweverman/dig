var path = require('path');
var passport = require('passport')

const config = require(path.resolve("./config") + '/config.json');
const services_path = path.resolve("./src/services");


var express = require('express');
var router = express.Router();

var passport_sp = require(path.resolve('./src/passport_sp.js'));
var ensureAuthenticated = passport_sp.ensureAuthenticated;

router.get('/', function (req, res) {
    let all_services = require('./services/descriptions.json');
    let user = req.user;

    if (!user) {
        res.render('index.ejs', { user: req.user });

    } else {

        let disabled_services = all_services.filter(service => !user.services.some(en_service => en_service == service.name));

        let enabled_services = all_services.filter(service => user.services.some(en_service => en_service == service.name));

        res.render('index.ejs', { user: req.user, enabled_services: enabled_services, disabled_services: disabled_services });


    }


});

router.get('/login', function (req, res) {
    res.render('login.ejs', { user: req.user });
});

router.get('/account', ensureAuthenticated, function (req, res) {
    res.render('account.ejs', { user: req.user });
});

router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});


module.exports = router;