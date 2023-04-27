import { env, msalConfig } from './config';
import * as msal from '@azure/msal-node';
import { signAccessToken } from './utils';
import { UserRoles } from './constants';

export class AuthService {
  msalInstance = new msal.ConfidentialClientApplication(msalConfig);
  cryptoProvider = new msal.CryptoProvider();

  // constructor(private userService: UserService) {}

  signIn(req, res, next) {
    req.session.csrfToken = this.cryptoProvider.createNewGuid();

    const state = this.cryptoProvider.base64Encode(JSON.stringify({ csrfToken: req.session.csrfToken }));

    const authCodeUrlRequestParams = { state, scopes: ['User.Read', 'email'] };
    const authCodeRequestParams = { scopes: ['User.Read', 'email'] };

    return this.redirectToAuthCodeUrl(req, res, next, authCodeUrlRequestParams, authCodeRequestParams);
  }

  async redirect(req, res, next) {
    if (req.body.state) {
      const state = JSON.parse(this.cryptoProvider.base64Decode(req.body.state));

      if (state.csrfToken === req.session.csrfToken) {
        req.session.authCodeRequest.code = req.body.code;
        req.session.authCodeRequest.codeVerifier = req.session.pkceCodes.verifier;
        try {
          const tokenResponse = await this.msalInstance.acquireTokenByCode(req.session.authCodeRequest);
          req.session.accessToken = tokenResponse.accessToken;
          req.session.idToken = tokenResponse.idToken;
          req.session.account = tokenResponse.account;

          let userRole = null;
          const graphResponse = await fetch(env.graphMeEndpoint, {
            headers: {
              Authorization: `Bearer ${req.session.accessToken}`,
            },
          });
          const graphData = await graphResponse.json();
          // TODO: user wih multiple roles? optimize?
          // graphData.value.forEach((group) => {
          //   if (group.id === AzureAdRoles.DISTRIBUTOR) {
          //     userRole = UserRoles.DISTRIBUTOR;
          //   }
          //   if (group.id === AzureAdRoles.ADMIN) {
          //     userRole = UserRoles.ADMIN;
          //   }
          //   if (group.id === AzureAdRoles.MESSENGER) {
          //     userRole = UserRoles.MESSENGER;
          //   }
          //   if (group.id === AzureAdRoles.PLANNER) {
          //     userRole = UserRoles.PLANNER;
          //   }
          //   if (group.id === AzureAdRoles.SCANNER) {
          //     userRole = UserRoles.SCANNER;
          //   }
          // });
          // if (!userRole) {
          //   throw new Error('Could not find user role');
          // }
          const user = await userService.FindByEmail('danil@centillion.nl', UserRoles.DISTRIBUTOR);
          const userParams = this.getUserValues(userRole);

          if (!user || !user.succeeded) {
            // Create user automatic?
            throw new Error('Could not find user');
          }
          const accessToken = await signAccessToken(user.data);

          // TODO: check if we can redirect from here to our main application
          res.redirect(userParams.redirectAfterLogin + `?access_token=${accessToken}`);
        } catch (error) {
          next(error);
        }
      } else {
        next(new Error('csrf token does not match'));
      }
    } else {
      next(new Error('state is missing'));
    }
  }

  /**
   * Prepares the auth code request parameters and initiates the first leg of auth code flow
   * @param req: Express request object
   * @param res: Express response object
   * @param next: Express next function
   * @param authCodeUrlRequestParams: parameters for requesting an auth code url
   * @param authCodeRequestParams: parameters for requesting tokens using auth code
   */
  private async redirectToAuthCodeUrl(req, res, next, authCodeUrlRequestParams, authCodeRequestParams) {
    // Generate PKCE Codes before starting the authorization flow
    const { verifier, challenge } = await this.cryptoProvider.generatePkceCodes();

    req.session.pkceCodes = {
      challengeMethod: 'S256',
      verifier: verifier,
      challenge: challenge,
    };

    req.session.authCodeUrlRequest = {
      redirectUri: env.azureADRedirectUri,
      responseMode: 'form_post',
      codeChallenge: req.session.pkceCodes.challenge,
      codeChallengeMethod: req.session.pkceCodes.challengeMethod,
      ...authCodeUrlRequestParams,
    };

    req.session.authCodeRequest = {
      redirectUri: env.azureADRedirectUri,
      code: '',
      ...authCodeRequestParams,
    };

    // Get url to sign user in and consent to scopes needed for application
    try {
      const authCodeUrlResponse = await this.msalInstance.getAuthCodeUrl(req.session.authCodeUrlRequest);
      res.redirect(authCodeUrlResponse);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthService()
