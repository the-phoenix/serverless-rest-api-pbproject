import Boom from 'boom';

const DEBUG_BOOM = process.env.DEBUG_BOOM;  // eslint-disable-line
const DEBUG_INTERNAL = process.env.DEBUG_INTERNAL;  // eslint-disable-line

function buildResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body
  };
}

export function success(body, isCreated) {
  return buildResponse(isCreated ? 201 : 200, JSON.stringify(body));
}

export function failure(err) {
  if (Boom.isBoom(err)) {
    DEBUG_BOOM && console.log(err);
    return buildResponse(err.statusCode, err.message);
  }

  DEBUG_INTERNAL && console.log(err);
  return buildResponse(500, err);
}
