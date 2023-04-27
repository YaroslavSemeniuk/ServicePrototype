const express = require('express');
const passport = require('passport');
const cors = require('cors');
const { bearerStrategy } = require('./config');
const azureAuthRouter = require('./routes');

const app = express();
app.use(express.json());

//enable CORS (for testing only -remove in production/deployment)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(passport.initialize());
passport.use('oauth-bearer', bearerStrategy);

app.use('/api', azureAuthRouter);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log('Listening on port: ', port));
