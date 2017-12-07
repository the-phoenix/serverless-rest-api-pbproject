const CognitoIdentityServiceProvider = require('aws-sdk').CognitoIdentityServiceProvider;

const cognito = new CognitoIdentityServiceProvider({ region: 'us-east-1' });

cognito.adminCreateUser({
  UserPoolId: 'us-east-1_TMmCoPWuF',
  Username: 'jamesjames',
  MessageAction: 'SUPPRESS',
  TemporaryPassword: 'hey12345',
  UserAttributes: [
    {
      Name: 'custom:type',
      Value: 'child'
    },
    {
      Name: 'name',
      Value: 'JamesJames'
    },
    {
      Name: 'preferred_username',
      Value: 'jamesjames'
    }
  ],
  ValidationData: [
    {
      Name: 'pureUserName', /* required */
      Value: 'jamesjames'
    },
  ]
}, (err, data) => {
  err && console.log('error - ', err);
  data && console.log('data - ', data);
});
