'use strict';

// socket io -- the cdnjs script is in the HTML template above this script file
var socket = io();

// https://www.npmjs.com/package/cors-anywhere
jQuery.ajaxPrefilter(function(options) {
    if (options.crossDomain && jQuery.support.cors) {
        options.url = 'https://cors-anywhere.herokuapp.com/' + options.url;
    }
});

window.onload = function () {

  socket.on('error message', function (data) {
    if (data.display) {
      document.querySelector('.error-message').classList.remove('visibility--hide');
    }
    else document.querySelector('.error-message').classList.add('visibility--hide');
  });

  // initialize chart here
  socket.emit('request tickers', {});
  

  // any update to the trackers will trigger a repaint
  socket.on('update processed', function (data) {
    socket.emit('request tickers', {});
  });

  // add stock
  document.querySelector('.btn--submit').addEventListener('click', e => {
    e.preventDefault(); // this is why the form submission goes through anyway even with the pattern field
    // Use the title attribute to describe the pattern to help the user.
    
    //console.log(document.querySelector('.form__input--add').value);
    if (document.querySelector('.form__input--add').value) { 
      // may want to sanitize this before passing it along
      socket.emit('add ticker', { ticker: document.querySelector('.form__input--add').value.toUpperCase() });
      // clear the input field
      document.querySelector('.form__input--add').value = '';
    }
  });
  
  // remove stock
  document.querySelector('.btn--remove').addEventListener('click', e => {
    e.preventDefault();
    if (document.querySelector('.form__input--remove').value) {
      socket.emit('remove ticker', { ticker: document.querySelector('.form__input--remove').value.toUpperCase() });
      // clear the input field
      document.querySelector('.form__input--remove').value = '';
    }
  });

  // load current stocks and have it painted in highstocks/highchart
  // have this triggered on first load to load the first painting of highcharts
  // and for subsequent paintings, just retrigger this socket event with updated data
  socket.on('repaint', function (data) {

    // remove all old elements:
    let stocksNode = document.querySelector('.stocks');
    while(stocksNode.firstChild) {
      stocksNode.removeChild(stocksNode.firstChild);
    }


    // given the stock ticker data
    console.log('Logging data: ' + data.stockTickers);

    // seems horribly inefficient to redo all the AJAX calls, redraws/repaints after each addition/subtraction of a stock ticker, but this seems the price to pay for not saving the stock data beyond the name to the db.
    // it is possible to use local storage to save the previous data and retrieve it there instead of making repeated AJAX calls

    // following the highcharts example:
    let seriesOptions = [],
        seriesCounter = 0,
        names = data.stockTickers;

    let to = new Date();
    let from = new Date(to);
  
    from.setMonth(to.getMonth() - 12);

    let urlFromSegment = `&a=${from.getUTCMonth()}&b=${from.getUTCDate()}&c=${from.getUTCFullYear()}`;
    let urlToSegment = `&a=${to.getUTCMonth()}&b=${to.getUTCDate()}&c=${to.getUTCFullYear()}`;

    let historicalURLs = names.map(stockTicker =>
      `http://real-chart.finance.yahoo.com/table.csv?s=${stockTicker}${urlFromSegment}${urlToSegment}`);


  //    let companyNameURL = 'http://autoc.finance.yahoo.com/autoc?query=mcd&region=1&lang=en';

    let nameURLs = names.map(stockTicker => 
      `http://autoc.finance.yahoo.com/autoc?query=${stockTicker.toLowerCase()}&region=1&lang=en`);

  //  console.log(historicalURLs);
  //  console.log(nameURLs);

    //retrieveData(historicalURLs, nameURLs);
    
    names.forEach((name, index) => {
      // check if these items are in session storage, and if the dates match.
      // if so, retrieve from session storage:
      if (sessionStorage.getItem(name) && checkLastUpdate((JSON.parse(sessionStorage.getItem(name))).lastUpdated)) {
        console.log('loading ' + name + ' from session storage');
        let sessionStoredStock = JSON.parse(sessionStorage.getItem(name));
        seriesOptions[index] = {
          name: name,
          data: sessionStoredStock.data
        };
        seriesCounter += 1;

        console.log('generating UI for: ' + sessionStoredStock.company);
        generateStockUIElement(name, sessionStoredStock.company, index);

        if (seriesCounter === names.length) {
          // actual repaint
          createChart(seriesOptions);
        }

      }
      // otherwise, ajax the data
      else {
        let companyName = '';
        let today = new Date();
        let sessionData, days;

        

        // grab the full name of the company
        let promise1 = $.get(nameURLs[index])
        .then(function (data) {
         // console.log(data);
          companyName = data.ResultSet.Result[0].name;
          
          console.log('generating UI from ajax for: ' + companyName);
          console.log('data: ' + data.ResultSet.Result[0].name);
          generateStockUIElement(name, companyName, index)
        });


        let promise2 = 

          // grab historical stock data of the company
          $.get(historicalURLs[index], function (data) {
            console.log('ajax request for: ' + name);
            let relevantData = data.split(/\r\n|\n/).sort().map(row => {
              let items = row.split(',');
              // date and stock closing value
              return [Date.parse(items[0]), parseFloat((+items[4]).toFixed(2))]; 
            });
            
            days = relevantData.filter((row, i) => {
              return row[0] && i !== 0; // remove title rows and non-content rows
            });
          });


        Promise.all([promise1, promise2])
          .then(() => {

            // will also need to save the date too and if the time difference is less than a day,
            // do not try to grab data again?
            sessionData = { stock: name, company: companyName, data: days, lastUpdated: today };
            console.log('session data for: ' + name + ' ' + companyName);
            console.log(sessionData);

            sessionStorage.setItem(name, JSON.stringify(sessionData));

            seriesOptions[index] = {
              name: name,
              data: days
            };

            seriesCounter += 1;

            if (seriesCounter === names.length) {
                // actual repaint
                createChart(seriesOptions);
              }
          });
          
    
      }

      
      


      // if not, retrieve data first, process, then store in session storage
      // overwriting any old stock ticker dates
            
      // check sessions storage if the name exists. If so, then retrieve the name there
      
      // else, retrieve the name from the name URL and save it to session storage

    });

    
   
  });


  // load new stocks
  socket.on('load stock', function (data) {
    // check to see if the stock is already listed
  });

};

// http://www.highcharts.com/stock/demo/compare
function createChart (seriesOptions) {
  Highcharts.stockChart(document.querySelector('.chart'), {
    rangeSelector: {
      selected: 4
    },
    /*
    xAxis: {
      min: new Date('2000/10/22').getTime(),
      max: new Date('2010/10/22').getTime(),
    },
    */
    yAxis: {
      labels: {
        formatter: function () {
          return (this.value > 0 ? ' + ' : '') + this.value + '%';
        }
      },
      plotLines: [{
        value: 0,
        width: 2,
        color: 'silver'
      }]
    },

    plotOptions: {
      series: {
        compare: 'percent',
        showInNavigator: true
      }
    },

    tooltip: {
      pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.change}%)<br/>',
      valueDecimals: 2,
      split: true
    },
    series: seriesOptions
  });

//  console.log(Highcharts.getOptions().colors);
}

function checkLastUpdate (date) {
  let sameDate = false;
  let lastUpdated = new Date(date);
 // console.log(testDate.getUTCDate());
  let now = new Date();
  if (lastUpdated.getUTCDate() === now.getUTCDate() && lastUpdated.getUTCMonth() === now.getUTCMonth() && lastUpdated.getUTCFullYear() === now.getUTCFullYear()) {
    sameDate = true;
  }
  return sameDate;
}

function generateStockUIElement (stockName, companyName, index) {

  let highchartColors = Highcharts.getOptions().colors;
 // console.log(highchartColors);
 // console.log(index);

  if (index % 2 === 0) {
    let newRow = document.createElement('div');
    newRow.classList.add('row');
    document.querySelector('.stocks').appendChild(newRow);
  }

  let stockWrapper = document.createElement('div');
  stockWrapper.className = 'wrapper--stock medium-6 large-6 columns';
  document.querySelector('.stocks').lastChild.appendChild(stockWrapper);


  console.log('color for ' + stockName + ': ' + highchartColors[index]);
  //let fragment = document.createDocumentFragment();
  let stock = document.createElement('div');
  stock.className = 'stock';
 // stock.classList.add(stockName);
  //stock.style.background = highchartColors[index];
  stock.style.border = '1px solid ' + highchartColors[index];
  stock.setAttribute('data-border-color', highchartColors[index]);
  stockWrapper.appendChild(stock);
  let ticker = document.createElement('div');
  ticker.classList.add('stock__ticker');
  ticker.textContent = stockName;
  stock.appendChild(ticker);
  let company = document.createElement('div');
  company.classList.add('stock__company-name');
  company.textContent = companyName;
  stock.appendChild(company);
  /*
  let remove = document.createElement('img');
  remove.src = '/static/img/cross.svg';
  remove.classList.add('stock__remove');
  remove.textContent = 'Remove';
  stock.appendChild(remove);
  remove.addEventListener('click', e => {
    socket.emit('remove ticker', { ticker: stockName });
    e.target.parentNode.parentNode.removeChild(e.target.parentNode);
  });
  */
  let remove = document.createElement('button');
  remove.className = 'hollow button alert stock__remove';
  remove.setAttribute('type', 'button');
  stock.appendChild(remove);
  let srClose = document.createElement('span');
  srClose.classList.add('show-for-sr');
  srClose.textContent = 'Close';
  remove.appendChild(srClose);
  let close = document.createElement('span');
  close.classList.add('stock__remove--icon');
  close.setAttribute('aria-hidden', 'true');
  close.innerHTML = '&times;';
  remove.appendChild(close);
  /*
  let icon = document.createElement('i');
  icon.classList.add('fi-x');
  close.appendChild(icon);
  */
  remove.addEventListener('click', e => {
    socket.emit('remove ticker', { ticker: stockName });
    e.target.parentNode.parentNode.removeChild(e.target.parentNode);
  });


}
