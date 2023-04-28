import express from 'express';
import passport from 'passport';

const authService = require('./services/AuthService');

const azureAuthRouter = express.Router();
azureAuthRouter.get('/signinad', authService.signInAD);
azureAuthRouter.get('/signinb2c', authService.signInB2C);

// API endpoint, one must present a bearer accessToken to access this endpoint
azureAuthRouter.post(
  '/redirect',
  passport.authenticate('oauth-bearer', {
    session: true,
    failureRedirect: '/login',
  }),
  authService.redirect
);

module.exports = azureAuthRouter;
