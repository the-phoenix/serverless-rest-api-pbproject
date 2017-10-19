import { path } from 'ramda';

export default function parseEvent(event) {
  let data;

  try {
    data = JSON.parse(event.body);
  } catch (e) {
    console.error('Error occur during parsing request body', e);
    data = {};
  }

  return {
    body: data,
    path: path(['requestContext', 'resourcePath'], event),
    httpMethod: path(['requestContext', 'httpMethod'], event),
    stage: path(['requestContext', 'stage'], event),
    params: event.pathParameters || event.path,
    queryParams: event.queryStringParameters || event.query,
    cognitoPoolClaims: event.cognitoPoolClaims,
  };
}

export function parseCognitoPreSignupEvent(event) {
  return {
    attributes: path(['request', 'userAttributes'], event),
    userName: event.userName,
    userPoolId: event.userPoolId,
    validationData: path(['request', 'validationData'], event) || {}
  };
}
