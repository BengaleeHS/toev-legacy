var express = require('express');
var passport = require('passport');
var router = express.Router();

router.get('/', passport.authenticate('twitter'));
router.get('/callback', passport.authenticate('twitter', { failureRedirect: '/auth/error' }), function (req, res) { res.redirect("/"); });

module.exports = router;