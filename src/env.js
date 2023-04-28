const BearerStrategy = require('passport-azure-ad').BearerStrategy;

const bearerOptions = {
  identityMetadata: `https://${process.env.AD_B2C_TENANT_NAME}.b2clogin.com/${process.env.AD_B2C_TENANT_NAME}.onmicrosoft.com/B2C_1_susi/v2.0/.well-known/openid-configuration`,
  clientID: process.env.AD_B2C_CLIENT_ID,
  audience: process.env.AD_B2C_CLIENT_ID,
  policyName: 'B2C_1_susi',
  // TODO: Passport uses on 'redirect/' which processes both authorization types...
  isB2C: true,
  loggingLevel: 'info',
};

const bearerStrategy = new BearerStrategy(bearerOptions, (token, done) =>
  done(null, {}, token)
);

const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set this to true on production
  },
};

const msalConfigSystem = {
  loggerOptions: {
    loggerCallback(loglevel, message, containsPii) {
      console.log(message);
    },
    piiLoggingEnabled: false,
    logLevel: 'Info',
  },
};

const msalADConfig = {
  auth: {
    clientId: process.env.AD_CLIENT_ID,
    clientSecret: process.env.AD_CLIENT_SECRET,
    authority: process.env.CLOUD_INSTANCE + process.env.AD_TENANT_ID,
  },
  system: msalConfigSystem,
};

const msalB2CConfig = {
  auth: {
    clientId: process.env.AD_B2C_CLIENT_ID,
    clientSecret: process.env.AD_B2C_CLIENT_SECRET,
    authority: process.env.SIGN_UP_SIGN_IN_POLICY_AUTHORITY,
    knownAuthorities: [process.env.AUTHORITY_DOMAIN], //This must be an array
    // redirectUri: process.env.AZURE_AD_REDIRECT_URI,
  },
  system: msalConfigSystem,
};

module.exports = {
  msalADConfig,
  msalB2CConfig,
  sessionConfig,
  bearerStrategy,
  graphMeEndpoint:
    process.env.GRAPH_API_ENDPOINT +
    'v1.0/me/memberOf/microsoft.graph.group?$select=displayName,id',
  azureADRedirectUri: process.env.AZURE_AD_REDIRECT_URI,
};
