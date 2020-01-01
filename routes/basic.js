var path = require('path');
const config = require(path.resolve("./config") + '/config.json');
var express = require('express');
var router = express.Router();

var passport_sp = require(path.resolve('./src/passport_sp.js'));
var ensureAuthenticated = passport_sp.ensureAuthenticated;

router.get('/', function (req, res) {
    res.render('index.ejs', { user: req.user });
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