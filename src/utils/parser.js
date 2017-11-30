import { path, pathOr, pick } from 'ramda';
import User from 'models/User';

export function parseCognitoUser(user) {
  const WHITE_LIST = [
    'sub', 'cognito:username', 'custom:type', 'custom:familyIds', 'cognito:groups',
    'email', 'preferred_username', 'phone_number', 'name'
  ];

  return Object.keys(pick(WHITE_LIST, user)).reduce((container, attribName) => {
    const newAttribName = User.attribNameMapper(attribName);

    if (newAttribName === 'familyIds') {
      container[newAttribName] = user[attribName] ? user[attribName].split(',') : [];  // eslint-disable-line
    } else {
      container[newAttribName] = user[attribName];  // eslint-disable-line
    }

    return container;
  }, {});
}

export default function parseEvent(event) {
  let data = {};

  if (event.body) {
    try {
      data = JSON.parse(event.body);
    } catch (e) {
      console.error('Error occur during parsing request body', e);
      data = {};
    }
  }

  return {
    body: data,
    path: path(['requestContext', 'resourcePath'], event),
    httpMethod: path(['requestContext', 'httpMethod'], event),
    stage: path(['requestContext', 'stage'], event),
    currentUser: parseCognitoUser(pathOr({}, ['requestContext', 'authorizer', 'claims'], event)),
    params: event.pathParameters || event.path,
    queryParams: (event.queryStringParameters || event.query) || {},
    cognitoPoolClaims: event.cognitoPoolClaims,
  };
}

export function parseCognitoEvent(event) {
  return {
    attributes: path(['request', 'userAttributes'], event),
    cognitoUserName: event.userName,
    userPoolId: event.userPoolId,
    validationData: path(['request', 'validationData'], event) || {}
  };
}

/* Captured part of api gateway event object
"requestContext": {
  "path": "/dev/family/c796d733-9779-45c5-a130-20fd1fd0b652",
  "accountId": "501132611696",
  "resourceId": "x4qw16",
  "stage": "dev",
  "authorizer": {
    "claims": {
      "custom:type": "parent",
      "custom:familyIds": "",
      "sub": "a2f5acbc-6e3e-4acf-b13f-9ea98e474237",
      "cognito:groups": "Parent",
      "email_verified": "true",
      "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_TMmCoPWuF",
      "phone_number_verified": "true",
      "cognito:username": "james-randomstring",
      "preferred_username": "james",
      "cognito:roles": "arn:aws:iam::501132611696:role/Pennyboxapp-user-parent-role",
      "aud": "3njvvckmopmluojj2t8t1r80v8",
      "token_use": "id",
      "auth_time": "1508938841",
      "name": "James",
      "phone_number": "+12345550100",
      "exp": "Wed Oct 25 14:40:41 UTC 2017",
      "iat": "Wed Oct 25 13:40:41 UTC 2017",
      "email": "jameslin@gmx.hk"
    }
  },
  "requestId": "ee2a1f8e-b98b-11e7-905f-71f10bc05413",
  "identity": {
    "cognitoIdentityPoolId": null,
    "accountId": null,
    "cognitoIdentityId": null,
    "caller": null,
    "apiKey": "",
    "sourceIp": "100.100.100.100",
    "accessKey": null,
    "cognitoAuthenticationType": null,
    "cognitoAuthenticationProvider": null,
    "userArn": null,
    "userAgent": "insomnia/5.9.6",
    "user": null
  },
  "resourcePath": "/family/{id}",
  "httpMethod": "GET",
  "apiId": "fr6arqln81"
}, */
