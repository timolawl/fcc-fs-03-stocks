'use strict';

module.exports = (app) => {
  app.route('/')
    .get((req, res) => {
      res.render('index');
    });

  app.use((req, res) => { res.status(400).send('Bad request.'); });
};
