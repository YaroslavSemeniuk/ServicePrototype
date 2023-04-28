const express = require('express');
const session = require('express-session');
const passport = require('passport');

const { env } = require('./src/env');
const azureAuthRouter = require('./src/routes');

const app = express();
app.use(express.json());

app.use(session(env.sessionConfig));

app.use(passport.initialize());
passport.use('oauth-bearer', env.bearerStrategy);

app.use('/auth', azureAuthRouter);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log('Listening on port: ', port));
