// StockRouter.js

/* CONFIG & IMPORTS */
var express = require('express');
var router = express.Router();
var dotenv = require('dotenv').config();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var stockCtrl = require('../controllers/stockController');
var authCtrl = require('../controllers/authController');
/******************************************************/

/* MIDDLEWARE */
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
/******************************************************/

/* ROUTES */
// get - RETURN ALL STOCKS
router.get('/', stockCtrl.GetAll);

// get - RETURN ONE STOCK
router.get('/:id', stockCtrl.GetOne);

// post - RETURN COLLECTION MATCHING SEARCH CRITERIA
router.post('/custom', stockCtrl.GetCustom);

// get - UPDATE ALL STOCKS
router.post('/update', authCtrl.VerifyToken, stockCtrl.Update);

module.exports = router;