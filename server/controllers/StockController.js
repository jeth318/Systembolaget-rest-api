
var express = require('express');
var router = express.Router();
var Stock = require('../models/Stock');
var Hash = require('../models/Hash');
const _ = require("lodash");
const parseString = require("xml2js").parseString;
const fs = require("fs");
var rp = require("request-promise");
var sha = require("sha256");
const remoteEndpoint = require('../endpoints');


// RETURNS ALL THE STOCKS IN THE DATABASE
function GetAll(req, res) {
  Stock.find({}, function (err, stocks) {
    if (err) return res.status(500).send("There was a problem finding the stocks." + err);
    res.status(200).json({ stocks });
  });
}

// RETURNS CUSTOM STOCKS FROM THE DATABASE
function GetCustom(req, res) {
  // console.log(req.body);
  let customQuery = {};
  Object.keys(req.body).forEach(function (prop) {
    customQuery[prop] = new RegExp(".*" + req.body[prop] + ".*");
  });

  Stock.find(customQuery, function (err, stocks) {
    if (err) return res.status(500).send("There was a problem finding the stocks." + err);
    res.status(200).send(stocks);
  })
    .limit(req.body["limit"] ? parseInt(req.body["limit"]) : null);

}

// GETS A SINGLE STOCK IN THE DATABASE
function GetOne(req, res) {
  Stock.findById(req.params.id, function (err, stock) {
    if (err) return res.status(500).send("There was a problem finding the stock." + err);
    if (!stock) return res.status(404).send("No stock found.");
    res.status(200).json({ stock });
  });
}

// DELETES A STOCK FROM THE DATABASE
function Remove(req, res) {
  Stock.findByIdAndRemove(req.params.id, function (err, stock) {
    if (err) return res.status(500).send("There was a problem deleting the stock." + err);
    res.status(200).json({ message: "Stock: " + stock.name + " was deleted." });
  });
}


// UPDATES ALL STOCKS IN THE DATABASE
function Update(req, res) {

  let backup = {};
  let oldStocks, newStocks, storedHash;
  const p1 = Stock.find({});
  
  console.log(remoteEndpoint.STOCK);
  
  const p2 = rp(remoteEndpoint.STOCK);
  const p3 = Hash.findOne({ 'type': 'stocks' })

  Promise.all([p1, p2, p3])
    .then((data) => {
      console.log('All initial promises resolved')
      oldStocks = data[0];
      newStocks = data[1];
      storedHash = data[2] ?  data[2].hash : '';

      const options = { explicitArray: false, normalizeTags: true, attrkey: "attribute" };
      return new Promise((resolve, reject) => {
        console.log('Parsing XML...')
        parseString(newStocks, options, function (err, parsedData) {
          console.log('Done parsing XML...')
        console.log('RÖV');

          err ? reject(err) : resolve(parsedData)
        });
      })
    })
    .then((parseResult) => {
      const parsedXml = parseResult.butikartikel.butik;
      console.log('RÖV');

      console.log('Checking hash...')
      // console.log(parsedXml);
      // Compares hash of new stocks to current stored hash. Ignores update if match.
      if (sha(parsedXml) === storedHash) {
        return 'No need to update';
      } else {
        console.log('Removing current stocks...')
        return Stock.remove({})
          .then(() => {
            console.log('Inserting new stocks...')
            return Stock.insertMany(prettyStocks(parsedXml))
          })
          .then(() => {
            console.log('Updating hash... ');
            return Hash.findOneAndUpdate({ 'type': 'stocks' }, { hash: sha(parsedXml), updatedAt: new Date() })
          })
          .then(() => {
            console.log('Update completed!');
            return 'Update completed!'
          })
      }
    })
    .then((message) => {
      // console.log(message); 
      return res.status(200).json({ message })
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: "There was a problem updating the stocks. ", explanation: err })
    })
}

function Availability(req, res) {
  //console.log(req.body)
  if (!req.body.store_nr || !req.body.product_nr) {
    return res.status(500).json({ error: "There was a problem checking availibility. Check your params." })
  }

  const store_nr = req.body.store_nr;
  const product_nr = req.body.product_nr;
  const full_response = req.body.full_response;
  
  if (!full_response) {
    Stock.findOne({ store_id: store_nr })
      .then((store) => {
        return res.status(200).json({store: store_nr, product: product_nr, availible: _.includes(store.availableProducts, product_nr) });
      })
      .catch((err) => console.log(err))
  } else {
    return Stock.find({})
      .then((stocks) => {
        const storesInStock = _.map(stocks, (stock) => {
          console.log(stock)
          
          if (stock.availableProducts[product_nr] > 0) {
            console.log('HELLO')
            return stock.store_id;
          }
        })
        return res.status(200).json({product: product_nr, storesWhereAvailible: storesInStock});
      })
      .catch((err) => console.log({ error: "There was a problem checking availibility. Check your params.", explanation: err }))
  }
}


function prettyStocks(stockCollection) {
  return _.map(stockCollection, (stock) => {
    let store_id = stock.attribute.ButikNr;
    let availableProducts = stock.artikelnr;
    return { store_id, availableProducts };
  })
}



// IsProductInStock('0102', '701').then((res)=>console.log(res))

module.exports = { GetAll, GetOne, Remove, Update, GetCustom, Availability }