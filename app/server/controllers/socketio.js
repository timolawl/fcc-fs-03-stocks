'use strict';

const fetch = require('node-fetch');

const Stock = require('../models/stock');

module.exports = io => {

  // acting as route and controller here.
  // the structured formatting would help for sure..
  

  io.on('connection', function (socket) {
    socket.on('add ticker', function (data) {
      // first check to see if the stock is already in the db.
      console.log(data.ticker);

      Stock.findOne({ stockTicker: data.ticker }).exec() // rather than passing a cb to exec..
        .then(stock => {
          if (!stock) {
            // problem is that it may not be a valid ticker.
            // need to make a call to another server to check ticker validity.
            // that or somehow check it frontend, but it's better to check it here too

            // checking ticker validity by doing a fetch on the historical data
            let to = new Date();
            let from = new Date(to);
          
            from.setMonth(to.getMonth() - 12);

            let urlFromSegment = `&a=${from.getUTCMonth()}&b=${from.getUTCDate()}&c=${from.getUTCFullYear()}`;
            let urlToSegment = `&a=${to.getUTCMonth()}&b=${to.getUTCDate()}&c=${to.getUTCFullYear()}`;
            

            let historicalURL = `http://real-chart.finance.yahoo.com/table.csv?s=${data.ticker}${urlFromSegment}${urlToSegment}`;

       //     console.log(historicalURL);


            return fetch(historicalURL, { method: 'GET' })
              .then(res => {
          
                if (res.status !== 404) {
                  console.log('stock exists! adding to db');
                  let newStock = new Stock();
                  newStock.stockTicker = data.ticker;
                  socket.emit('error message', { display: false });
                  return newStock.save(err => {
                    if (err) throw err;
                  });
                }
                else {
                  console.log('No stock is found under this name.');
                  socket.emit('error message', { display: true });
                }
              }); 

            console.log('no stock was found with the given stock ticker...');
          }
          else {
            socket.emit('stock already added', {});
            console.log('stock is already in the db...');
          }
        })
        .then(() => {
          Stock.find({}, (err, stocks) => {
            console.log('Stock(s) currently in the db are: ' + stocks);
          });
        })

        .then(() => io.emit('update processed', {})); // emit to all users including sender
    });

    socket.on('remove ticker', function (data) {
      console.log('removing ticker...');
      Stock.deleteOne({ stockTicker: data.ticker }, (err, result) => {
        if (err) throw err;
        if (!result.deletedCount) {
          socket.emit('error message', { display: true });
        }
        else socket.emit('error message', { display: false });
        console.log(result);
      });
      //socket.emit('update processed', {});
      io.emit('update processed', {}); // emit to all users including sender
    });

    socket.on('request tickers', function (data) {
      Stock.find({}, (err, stocks) => {
        if (err) throw err;
        if (!stocks) {
          console.log('no stocks found.');
        }
        else {
          let stockTickersArray = stocks.map(stock => stock.stockTicker);
          console.log(stockTickersArray);

          socket.emit('repaint', { stockTickers: stockTickersArray });
        }
      });
    });
  });
};
