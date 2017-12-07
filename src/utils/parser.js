import { path, pathOr } from 'ramda';
import User from 'models/User';

export function parseCognitoUser(user) {
  console.log('hey user go here', user);
  const WHITE_LIST = [
    'sub', 'cognito:username', 'cognito:groups',
    'custom:type', 'custom:familyIds', 'custom:deviceTokens',
    'email', 'preferred_username', 'phone_number', 'name'
  ];

  return WHITE_LIST.reduce((container, attribName) => {
    const newAttribName = User.attribNameMapper(attribName);

    if (newAttribName === 'familyIds') {
      container[newAttribName] = user[attribName] ? user[attribName].split(',') : [];  // eslint-disable-line
    } else {
      container[newAttribName] = user[attribName];  // eslint-disable-line
    }

    return container;
  }, {});
}

export function parseAPIGatewayEvent(event) {
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

export function parseSNSEvent(event) {
  const sns = path(['Records', 0, 'Sns'], event);
  let message;

  try {
    message = JSON.parse(path(['Message'], sns));
  } catch (e) {
    message = {};
  }

  return {
    message,
    attributes: path(['MessageAttributes'], sns)
  };
}
