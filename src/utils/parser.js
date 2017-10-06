export default function parseEvent(event) {
  return {
    data: JSON.parse(event.body || '{}'),
    path: event.requestContext.resourcePath,
    httpMethod: event.requestContext.httpMethod,
    stage: event.requestContext.stage,
    params: event.pathParameters,
    queryParams: event.queryStringParameters
  };
}

export function parseCognitoPreSignupEvent(event) {
  return {
    attributes: event.request.userAttributes,
    userName: event.userName,
    userPoolId: event.userPoolId,
    validationData: event.validationData
  };
}
