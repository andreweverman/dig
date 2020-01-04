var path = require('path');
var fs = require('fs');


const config = require(path.resolve("./config") + '/config.json');
const services_path = path.resolve("./src/services");


var express = require('express');
var router = express.Router();

var passport_sp = require(path.resolve('./src/passport_sp.js'));
var ensureAuthenticated = passport_sp.ensureAuthenticated;

router.get('/', function (req, res) {
    var user = req.user;
    // if (user) {
        // fs.readdir(services_path, (err, files) => {

        //     // gets all services
        //     var all_services = files.map(file => {
        //         let split = file.split(".")[0]
        //         return split.charAt(0).toUpperCase() + split.slice(1);
        //     });

        //     // want to get the services we have - services the user has

        //     var disabled_services = all_services;


        //     disabled_services.filter(service => !user.services.some(en_service => { en_service == service }));



        //     console.log(all_services)
        //     res.render('index.ejs', { user: req.user, disabled_services: disabled_services });

        // });

    // }
    res.render('index.ejs', { user: req.user});



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