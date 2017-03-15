'use strict';

const Controller = require('./controllers/controller');

module.exports = (app) => {

  const controller = new Controller();

  app.route('/')
    .get(controller.loadStocks);

/*
  app.use((req, res) => {
    if (req.isAuthenticated())
      res.render('404', { loggedIn: 'true', path: '404' });
    else res.render('404', { loggedIn: 'false', path: '404' });
  });
  */
  app.use((req, res) => { res.status(400).send('Bad request.'); });


};
