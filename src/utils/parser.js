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
