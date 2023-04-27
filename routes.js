import express from 'express';
const authService = require('./AuthService')
const azureAuthRouter = express.Router();


azureAuthRouter.get('/signin', authService.signIn);
// API endpoint, one must present a bearer accessToken to access this endpoint
azureAuthRouter.post('/redirect', passport.authenticate('oauth-bearer', { session: false }), authService.redirect);

module.exports = azureAuthRouter;
