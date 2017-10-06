import { parseCognitoPreSignupEvent } from 'utils/parser';

export async function preSignup(event, context) {
  const { userName } = parseCognitoPreSignupEvent(event);
  const validExp = /^[a-zA-Z]+[\w\d\.\-_]*$/; // eslint-disable-line

  if (!validExp.test(userName)) {
    return context.done(JSON.stringify({
      errorType: 'username validation error',
      errorMessage: 'username can only have A-Z a-z dot(.) underscore(_) and dash(-)'
    }), event);
  } else if (userName.length < 3) {
    return context.done(JSON.stringify({
      errorType: 'username validation error',
      errorMessage: 'username must have length > 3'
    }), event);
  }

  event.response.autoConfirmUser = true; // eslint-disable-line

  return context.done(null, event);
}

export default { preSignup }; // Add this for test
