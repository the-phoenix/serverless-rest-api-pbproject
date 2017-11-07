function buildResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    // body: JSON.stringify(body)
    body
  };
}

export function success(body, isCreated) {
  return buildResponse(isCreated ? 201 : 200, body);
}

export function failure(err, statusCode = 500) {
  return buildResponse(statusCode || err.statusCode, err);
}
