import { CognitoIdentityServiceProvider } from 'aws-sdk';

export default class UserModel {
  constructor() {
    this.cognito = new CognitoIdentityServiceProvider({ region: 'us-east-1' });
  }

  attribNameMapper(origin) { // eslint-disable-line
    if (origin === 'sub') {
      return 'userId';
    }

    if (origin === 'preferred_username') {
      return 'username';
    }

    return origin;
  }

  getByAccessToken(accessToken) {
    return this.cognito
      .getUser({ AccessToken: accessToken })
      .promise()
      .then(data => data.UserAttributes.reduce((container, attr) => {
        const key = this.attribNameMapper(attr.Name);

        container[key] = attr.Value;  // eslint-disable-line
        return container;
      }, {}));
  }

  fetchByAttribute(attribName, attribValue, userPoolId) {
    // Note that you can't search for custom attributes
    const params = {
      UserPoolId: userPoolId || process.env.COGNITO_POOL_ID,
      Filter: `${attribName} = "${attribValue}"`
    };

    return this.cognito
      .listUsers(params)
      .promise()
      .then(data => data.Users);
  }

  addUserToGroup(userName, groupName, userPoolId) {
    const params = {
      UserPoolId: userPoolId || process.env.COGNITO_POOL_ID,
      GroupName: groupName,
      Username: userName
    };

    return this.cognito
      .adminAddUserToGroup(params)
      .promise();
  }
}
