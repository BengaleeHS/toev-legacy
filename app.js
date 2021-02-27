'use strict';
var debug = require('debug');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var strategy = require('passport-twitter').Strategy;
var memstore = require('session-memory-store')(session);
var mysql = require('mysql');
var ev = require('events');
var router = express.Router();

var routes = require('./routes/index');
var auth = require('./routes/twitterauth');
var config = require('./config');

var callbackurl = 'https://toev-vote.herokuapp.com/auth/twitter/callback'


var app = express();

var pool = mysql.createPool({
    
    connectionLimit: 10,
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database

})


passport.use(new strategy({
    consumerKey: config.twitterapikey,
    consumerSecret: config.twitterapisecret,
    callbackURL: config.callbackURL
}, function (token, tokenSecret, profile, done) {
    process.nextTick(function () {

    });
    done(null, profile);
    }
));

passport.serializeUser(function (user, callback) {
    callback(null, user);
});
passport.deserializeUser(function (id, callback) {
    callback(null, id);
});

var store = new memstore({ expires: 60 * 60 * 1000, debug: true });

app.use(session({
    name: 'SESSION',
    secret: 'secret',
    id: 'sid',
    store: store,
    resave: true,
    saveUninitialized: true

}));

app.use(passport.initialize());
app.use(passport.session());

var connection = mysql.createConnection({
    host: config.host,
    user: config.username,
    password: config.password,
    database: config.database,
    multipleStatements: true,
});

if (config.use_database == true) {
    connection.connect();
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/auth/twitter',auth);
app.use('/', routes);

router.route('/').post(function (req, res, next) {
    if (req.isAuthenticated()) {

        pool.getConnection(function (err, conn) {
            if (err) {
                if (conn)
                    conn.release();
                return;
            }
            var question = {
                creator: req.user.id,
                question: req.body.context,
                q1: req.body.selection1,
                q2: req.body.selection2,
                q3: req.body.selection3,
                q4: req.body.selection4,
                q5: req.body.selection5,
                q6: req.body.selection6,

            };
            conn.query('insert into question set ?', question, function (err, result) {


                if (err)
                    return;
                conn.query('select * from question order by id desc limit 1', function (err, result) {
                    var id = result[0].id;
                    var vv = { vote: id, q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0 };
                    conn.query('insert into votedata set ?', vv, function (err, result) {
                        if (err) {
                            console.dir(err);
                        }
                        conn.release();

                    });
                });
            });
        });
        res.redirect('/');
    }
    else {
        res.redirect('/auth/twitter');

    }
});
router.route('/apply').post(function (req, res, next) {
    if (req.isAuthenticated()) {
        pool.getConnection(function (err, conn) {
            if (err) {
                if (conn)
                    conn.release();
                return;
            }
            conn.query('select * from log where voted=? AND user=?', [req.body.id, req.user.id], function (err, result) {
                if (err) {
                    console.dir(err);
                    if (conn)
                        conn.release();
                    return;
                }
                console.log(result);
                if (result.length > 0) {
                    conn.release();
                    return;
                }
                else {
                    var logdata = { user: req.user.id, voted: req.body.id };
                    conn.query('insert into log set ?', logdata, function (err, result) {
                        if (err)
                            console.dir(err);
                    });
                    conn.query('select * from votedata where(vote=?) limit 1', req.body.id, function (err, result) {
                        var id = result[0]['id'];
                        conn.query('UPDATE votedata SET q? = q?+1 WHERE id = ?', [req.body.sel, req.body.sel, id], function (err, result) {

                            if (err)
                                console.dir(err);
                        });
                    });
                    conn.release();
                }

            });

        });


        res.redirect('/');
    }
});
router.route('/menu').get(function (req, res, next) {
    if (req.isAuthenticated())
        res.redirect('/' + req.user.id);
    else {
        res.redirect('/auth/twitter');
    }
});
router.route('/result').post(function (req, res, next) {
    console.log(req.body.id);
    pool.getConnection(function (err, conn) {
        if (err) {
            console.dir(err);
            if (conn)
                conn.release();
            return;

        }
        conn.query('select * from votedata where vote=?', req.body.id, function (err, result) {
            conn.release();
            if (result)
                res.write(JSON.stringify(result));
            res.end();

        });
    });
});
router.route('/load').get(function (req, res, next) {
    if (req.isAuthenticated()) {
        pool.getConnection(function (err, conn) {
            if (err) {
                console.dir(err);
                if (conn)
                    conn.release();
                return;
            }
            conn.query('SELECT * FROM question order by id desc limit 100', function (err, result) {
                if (err)
                    console.dir(err);
                var data = result;
                conn.query('select * from log where user = ?', req.user.id, function (err, result) {
                    conn.release();

                    if (err)
                        console.dir(err);
                    res.writeHead(200, { 'content-type': 'application/json' });
                    res.write(JSON.stringify({ vote: data, log: result }));

                    res.end();
                });



            });
        });

    }
    else {
        next();
    }
});

app.use('/', router);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('404');
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('404');
});

app.set('port', process.env.PORT || app.get('port'));

var server = app.listen(app.get('port'));
