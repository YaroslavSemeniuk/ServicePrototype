import * as msal from '@azure/msal-node';
import { ConfidentialClientApplication } from '@azure/msal-node';

import {
  msalADConfig,
  msalB2CConfig,
  azureADRedirectUri,
  graphMeEndpoint,
} from '../env';
import { UserRoles, AuthorityType } from '../enums';

export class AuthService {
  msalADInstance = new msal.ConfidentialClientApplication(msalADConfig);
  msalB2CInstance = new msal.ConfidentialClientApplication(msalB2CConfig);

  /**
   * Prepares the auth code request parameters and initiates the first leg of auth code flow
   * @param req: Express request object
   * @param res: Express response object
   * @param next: Express next function
   * @param msalInstance
   * @param authCodeUrlRequestParams: parameters for requesting an auth code url
   * @param authCodeRequestParams: parameters for requesting tokens using auth code
   */
  async redirectToAuthCodeUrl(
    req,
    res,
    next,
    msalInstance: ConfidentialClientApplication,
    authCodeUrlRequestParams,
    authCodeRequestParams
  ) {
    req.session.authCodeUrlRequest = {
      redirectUri: azureADRedirectUri,
      responseMode: 'form_post',
      ...authCodeUrlRequestParams,
    };

    req.session.authCodeRequest = {
      redirectUri: azureADRedirectUri,
      code: '',
      ...authCodeRequestParams,
    };

    // Get url to sign user in and consent to scopes needed for application
    try {
      const authCodeUrlResponse = await msalInstance.getAuthCodeUrl(
        req.session.authCodeUrlRequest
      );
      res.redirect(authCodeUrlResponse);
    } catch (error) {
      next(error);
    }
  }

  signInAD(req, res, next) {
    const authCodeUrlRequestParams = {
      state: { authorityType: AuthorityType.AD },
      scopes: ['User.Read', 'email'],
    };
    const authCodeRequestParams = { scopes: ['User.Read', 'email'] };

    return this.redirectToAuthCodeUrl(
      req,
      res,
      next,
      this.msalADInstance,
      authCodeUrlRequestParams,
      authCodeRequestParams
    );
  }

  signInB2C(req, res, next) {
    const authCodeUrlRequestParams = {
      state: { authorityType: AuthorityType.B2C },
      scopes: ['openid', 'offline_access'],
    };
    const authCodeRequestParams = { scopes: ['openid', 'offline_access'] };

    return this.redirectToAuthCodeUrl(
      req,
      res,
      next,
      this.msalB2CInstance,
      authCodeUrlRequestParams,
      authCodeRequestParams
    );
  }

  async redirect(req, res, next) {
    if (!req.body.state) {
      next(new Error('state is missing'));
    }

    const state = req.body.state;
    try {
      const msalInstance =
        state.authorityType === AuthorityType.AD
          ? this.msalADInstance
          : this.msalB2CInstance;
      const tokenResponse = await msalInstance.acquireTokenByCode(
        req.session.authCodeRequest
      );
      req.session.accessToken = tokenResponse.accessToken;
      req.session.idToken = tokenResponse.idToken;
      req.session.account = tokenResponse.account;
      // TODO: for some reason we don't get access_token which is needed for below part.
      let userRole =
        state.authorityType === AuthorityType.B2C ? UserRoles.CUSTOMER : null;
      // TODO: temporary condition till we don't get access_token
      let graphData;
      if (!userRole) {
        const graphResponse = await fetch(graphMeEndpoint, {
          headers: {
            Authorization: `Bearer ${req.session.accessToken}`,
          },
        });
        graphData = await graphResponse.json();
      }

      req.session.graphResponce = graphData;
      // TODO: this app starts by: 'auth/' so we should modify '/api/auth/auth-redirect' route in main app
      res.redirect('/api/auth-redirect');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthService();
