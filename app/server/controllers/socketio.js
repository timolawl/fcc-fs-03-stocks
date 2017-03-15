'use strict';

const fetch = require('node-fetch');

const Stock = require('../models/stock');

module.exports = io => {

  // acting as route and controller here.
  // the structured formatting would help for sure..
  

  io.on('connection', function (socket) {
    socket.on('add ticker', function (data) {
      let historicalURL = 'http://real-chart.finance.yahoo.com/table.csv?s=MSFT&a=02&b=14&c=2016&d=02&e=14&f=2017&g=d&ignore=.csv';
      let companyNameURL = 'http://finance.yahoo.com/d/quotes.csv?s=GE&f=sn';

      fetch(historicalURL, { method: 'GET' })
        .then(res => console.log(res));
    });
  });
};
