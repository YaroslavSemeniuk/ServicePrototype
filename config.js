const BearerStrategy = require('passport-azure-ad').BearerStrategy;

const bearerOptions = {
  identityMetadata: `https://${process.env.TENANT_NAME}.b2clogin.com/${process.env.TENANT_NAME}.onmicrosoft.com/B2C_1_susi/v2.0/.well-known/openid-configuration`,
  clientID: process.env.CLIENT_ID,
  audience: process.env.CLIENT_ID,
  policyName: 'B2C_1_susi',
  isB2C: true,
  validateIssuer: true,
  loggingLevel: 'info',
  passReqToCallback: false
}

export const msalConfig = {
  auth: {
    clientId: process.env.CLIENT_ID,
    authority: process.env.CLOUD_INSTANCE + process.env.TENANT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, containsPii) {
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: 'Info',
    },
  },
};

export const bearerStrategy = new BearerStrategy(bearerOptions, (token, done) => {
    done(null, {}, token);
  }
);

export const env = {
  graphMeEndpoint: process.env.GRAPH_API_ENDPOINT + 'v1.0/me/memberOf/microsoft.graph.group?$select=displayName,id',
  azureADRedirectUri: process.env.AZURE_AD_REDIRECT_URI,
}
