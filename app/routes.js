import {Connection} from 'mysql2'
const mysql = require('mysql2');
// app/routes.js
const isLoggedIn = require('../utils/isLogged');
const con = require('../utils/pool');


var nomeAgencia;
var idAgencia;

function setVar(result,result2){
	nomeAgencia = result;
	idAgencia = result2;
}

//variaveis para reconectar
let db_config = {
    connectionLimit : 10,
    host: process.env.DB_HOST,
    user: "movimentacoes",
    password: process.env.DB_PASSWORD,
    database: "movimentacoes",
    port: "3306",
};

let conn = mysql.createConnection(db_config);

function handleDisconnect(){
    console.log('handleDisconnect()');
    conn = mysql.createConnection(db_config);

    conn.connect(function(err){
     if(err){
        console.log('Error when connecting to the database',err);
        setTimeout(handleDisconnect,1000);
     }
    });

    conn.on(' Database Error',function(err){
        console.log('Database error: '+ err.code, err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST'){
            handleDisconnect();
        }else{
            throw err;
        }
    });
}

module.exports = function(app, passport) {

	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	app.get('/', function(req, res) {
		res.render('index.ejs'); // load the index.ejs file
	});

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get('/login', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});

	// process the login form
	app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
		}),
        function(req, res) {
            console.log("hello");

            if (req.body.remember) {
              req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
              req.session.cookie.expires = false;
            }
			// req.session.user_id = user._id;
        res.redirect('/');
    });

	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	// app.get('/signup', function(req, res) {
		// render the page and pass in any flash data if it exists
	// 	res.render('signup.ejs', { message: req.flash('signupMessage') });
	// });

	// process the signup form
	// app.post('/signup', passport.authenticate('local-signup', {
	// 	successRedirect : '/profile', // redirect to the secure profile section
	// 	failureRedirect : '/signup', // redirect back to the signup page if there is an error
	// 	failureFlash : true // allow flash messages
	// }));

	// =====================================
	// PROFILE SECTION =========================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/profile', isLoggedIn, function(req, res) {
		conn.connect(function(err){
			if(err){
				console.log('Connection is asleep (time to wake it up):', err);
				setTimeout(handleDisconnect,1000);
			}
		});
		req.session.user_ID = req.user.ID;
		req.session.user_Agencia = req.user.ID_agencia;
		console.log(req.user);
		const Agencia = `select ID, nome_agencia from agencia where ID =${req.user.ID_agencia}`;
		//nomeAgencia = 'Albert';
		con.query(Agencia,function(err,result,fields){
			if(err) throw(err);	
			setVar(result[0].nome_agencia,result[0].ID);
			res
			.cookie('Agencia',nomeAgencia)
			.cookie('ID',idAgencia)
			.render('profile.ejs', {user : req.user,nomeAgencia // get the user out of session and pass to template
		})
	

		});
	});

	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
};


