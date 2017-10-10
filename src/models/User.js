import { CognitoIdentityServiceProvider } from 'aws-sdk';

export default class UserModel {
  constructor(dbClient) {
    this.cognito = new CognitoIdentityServiceProvider({ region: 'us-east-1' });
  }

  getByAccessToken(accessToken) {
    return this.cognito
      .getUser({ AccessToken: accessToken })
      .promise()
      .then(data => ({
      	username: data.Username,
      	attributes: data.UserAttributes
      }));
  }
}
