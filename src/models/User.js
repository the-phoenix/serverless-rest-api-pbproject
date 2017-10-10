import { CognitoIdentityServiceProvider } from 'aws-sdk';

export default class UserModel {
  constructor() {
    this.cognito = new CognitoIdentityServiceProvider({ region: 'us-east-1' });
  }

  getByAccessToken(accessToken) {
    return this.cognito
      .getUser({ AccessToken: accessToken })
      .promise()
      .then(data => Object.assign(
        { username: data.Username },
        data.UserAttributes.reduce((container, attr) => {
          const key = attr.Name === 'sub' ? 'userId' : attr.Name;

          container[key] = attr.Value;  // eslint-disable-line
          return container;
        }, {})
      ));
  }
}
