if (process.env.NODE_ENV !== "production"){
    require('dotenv').config();
}

// server.js

// set up ======================================================================
// get all the tools we need
const express  = require('express');
// const session  = require('express-session');
const session = require('cookie-session');
const cookieParser = require('cookie-parser');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override')
// const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const app      = express();
const port     = process.env.PORT || 8080;

const passport = require('passport');
const flash    = require('connect-flash');
const naviosRoutes = require('./routes/navios');
const requiRoutes = require('./routes/requisicoes');
const condiRoutes = require('./routes/condicionada');
const ExpressError = require('./utils/ExpressError');
const helmet = require('helmet');
//for e-mail sending


// configuration ===============================================================
// connect to our database

require('./config/passport')(passport); // pass passport for configuration


// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
// app.use(bodyParser.urlencoded({
// 	extended: true
// }));
// app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.engine('ejs',ejsMate);
app.set('view engine', 'ejs'); // set up ejs for templating
app.set('views',path.join(__dirname,'views'));
app.use(express.static(path.join(__dirname, 'public')));

// required for passport
app.use(session({
    name: 'sisprati_id',
	secret: process.env.SECRET,
	resave: true,
	saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: true
    }
 } )); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session
app.use(helmet({contentSecurityPolicy: false}));

app.use((req,res,next) => {
    res.locals.currentUser = req.user;
    res.locals.Sucesso = req.flash('Sucesso');
    res.locals.error = req.flash('error');
    next();
})

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport
app.use('/navios',naviosRoutes);
app.use('/requisicoes',requiRoutes);
app.use('/condicionada',condiRoutes);


app.all('*',(req,res,next) => {
    next(new ExpressError('Page not found','404'))
})

app.use((err,req,res,next) => {
    const {statusCode = 500, message = 'Something went wrong'} = err;
    if(!err.message) err.message = 'Something went wrong';
    res.status(statusCode).render('error',{ err })
})


// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);
