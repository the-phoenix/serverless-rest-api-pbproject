function buildResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(body)
  };
}

export function success(body) {
  return buildResponse(200, body);
}

export function failure(body, statusCode = 500) {
  return buildResponse(statusCode, body);
}
