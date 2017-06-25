'use strict';

// socket io -- the cdnjs script is in the HTML template above this script file
var socket = io();

window.onload = function () {

  // conditions for removing the cog loader:
  socket.on('no tickers', () => {
  // remove cog loader
    document.querySelector('.chart-loader').classList.add('display--hide');
  });

  socket.on('error message', function (data) {
    if (data.display) {
      document.querySelector('.error-message').classList.remove('visibility--hide');
    }
    else document.querySelector('.error-message').classList.add('visibility--hide');
  });

  // initialize chart here
  socket.emit('request tickers', {});
  
  // show the loader until the chart displays:
  document.querySelector('.chart-loader').classList.remove('display--hide');
  

  // any update to the trackers will trigger a repaint
  socket.on('update processed', function (data) {
    socket.emit('request tickers', {});
  });

  // add stock
  // document.querySelector('.btn--submit').addEventListener('submit', e => {
  document.querySelector('.stock--add').addEventListener('submit', e => {
    e.preventDefault(); // this is why the form submission goes through anyway even with the pattern field
    // client side limiting of string length:
    let inputAdd = document.querySelector('.form__input--add').value;

    if (inputAdd && /^[A-Za-z][A-Za-z\.:]{0,9}$/.test(inputAdd)) { // limit string length
      // may want to sanitize this before passing it along
      socket.emit('add ticker', { ticker: document.querySelector('.form__input--add').value.toUpperCase() });
      // clear the input field
      document.querySelector('.form__input--add').value = '';
    }
    else {
      // show error message
      document.querySelector('.error-message').classList.remove('visibility--hide');
    }
  });
  
  // remove stock
  // document.querySelector('.btn--remove').addEventListener('submit', e => {
  document.querySelector('.stock--remove').addEventListener('submit', e => {
    e.preventDefault();
    let inputRemove = document.querySelector('.form__input--remove').value;
    if (inputRemove && /^[A-Za-z][A-Za-z\.:]{0,9}$/.test(inputRemove)) {
      socket.emit('remove ticker', { ticker: document.querySelector('.form__input--remove').value.toUpperCase() });
      // clear the input field
      document.querySelector('.form__input--remove').value = '';
    }
    else {
      // show error message
      document.querySelector('.error-message').classList.remove('visibility--hide');
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

    // seems horribly inefficient to redo all the AJAX calls, redraws/repaints after each addition/subtraction of a stock ticker, but this seems the price to pay for not saving the stock data beyond the name to the db.
    // it is possible to use local storage to save the previous data and retrieve it there instead of making repeated AJAX calls
    
    // a good balance is to only remove those elements that are out of date by at least a day.
    
    // storing retrieved data in session storage:

    // following the highcharts example:
    let seriesOptions = [],
        seriesCounter = 0,
        names = data.stockTickers;

    let promises = names.map((name, index) => {
      // check if these items are in session storage, and if the dates match.
      // if so, retrieve from session storage:
        if (sessionStorage.getItem(name) && checkLastUpdate((JSON.parse(sessionStorage.getItem(name))).lastUpdated)) {
          let sessionStoredStock = JSON.parse(sessionStorage.getItem(name));
          seriesOptions[index] = {
            name: name,
            data: sessionStoredStock.data
          };
          seriesCounter += 1;

          if (seriesCounter === names.length) {
            // remove cog loader
            document.querySelector('.chart-loader').classList.add('display--hide');
            // actual repaint
            createChart(seriesOptions);
          }

        }
        // otherwise, ajax the data
        else {
          let companyName = '';
          let today = new Date();
          let sessionData, days;

          let to = new Date();
          let from = new Date(to);

          from.setMonth(to.getMonth() - 12);

          let month = from.getUTCMonth() + 1;
          if (month < 10) {
            month = `0${month}`;
          }

          let urlFromSegment = `${from.getUTCFullYear()}-${month}-${from.getUTCDate() - 2}`;
          let urlToSegment = `${to.getUTCFullYear()}-${month}-${to.getUTCDate() - 2}`;

          let URL = `https://www.quandl.com/api/v3/datasets/WIKI/${name}.json?api_key=hnTnwtHfNGzsTTSxAFZ4&start_date=${urlFromSegment}&end_date=${urlToSegment}`;

          return fetch(URL)
            .then(res => res.json())
            .then(json => {
              const re = /^(.*?)\(/;
              companyName = json.dataset.name.match(re)[1];
              days = json.dataset.data.map(data => [Date.parse(data[0]), data[4]]).sort();
            })
            .then(() => {
              // will also need to save the date too and if the time difference is less than a day,
              // do not try to grab data again?
              sessionData = { stock: name, company: companyName, data: days, lastUpdated: today };
              sessionStorage.setItem(name, JSON.stringify(sessionData));

              seriesOptions[index] = {
                name: name,
                data: days
              };

              seriesCounter += 1;

              if (seriesCounter === names.length) {
                // remove cog loader
                document.querySelector('.chart-loader').classList.add('display--hide');
                // actual repaint
                createChart(seriesOptions);
              }
            });
        }
    });

    Promise.all(promises)
      .then(() => {
        for (let i = 0; i < names.length; i++) {
          let company = JSON.parse(sessionStorage.getItem(names[i]));
          generateStockUIElement(names[i], company.company, i);
        }
      });

  });
};



// http://www.highcharts.com/stock/demo/compare
function createChart (seriesOptions) {
  Highcharts.stockChart(document.querySelector('.chart'), {
    rangeSelector: {
      selected: 4
    },
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
}

function checkLastUpdate (date) {
  let sameDate = false;
  let lastUpdated = new Date(date);
  let now = new Date();
  if (lastUpdated.getUTCDate() === now.getUTCDate() && lastUpdated.getUTCMonth() === now.getUTCMonth() && lastUpdated.getUTCFullYear() === now.getUTCFullYear()) {
    sameDate = true;
  }
  return sameDate;
}

function generateStockUIElement (stockName, companyName, index) {
  // create document fragment
  let fragment = document.createDocumentFragment();

  let highchartColors = Highcharts.getOptions().colors;

  // wrapper around a stock element
  let stockWrapper = document.createElement('div');
  stockWrapper.className = 'wrapper--stock medium-6 large-6 columns';

  // if not an even number of elements, make a new row.
  if (index % 2 === 0) {
    let newRow = document.createElement('div');
    newRow.classList.add('row');
    newRow.classList.add('row-' + index);
    fragment.appendChild(newRow);
    newRow.appendChild(stockWrapper);
  }
  else {
    fragment.appendChild(stockWrapper);
  }

  let stock = document.createElement('div');
  stock.className = 'stock';
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

  remove.addEventListener('click', e => {
    socket.emit('remove ticker', { ticker: stockName });
    e.target.parentNode.parentNode.removeChild(e.target.parentNode);
  });

  // depending on whether a new row was made or not, append appropriately:
  if (index % 2 === 0) {
    document.querySelector('.stocks').appendChild(fragment);
  }
  else {
    document.querySelector('.stocks').lastChild.appendChild(fragment);
    
  }


}
