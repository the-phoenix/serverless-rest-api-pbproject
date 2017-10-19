import { path } from 'ramda';
import { parseCognitoPreSignupEvent } from 'utils/parser';
import UserController from 'controllers/User';

const user = new UserController();

export async function preSignup(event, context) {
  const {
    attributes,
    validationData,
  } = parseCognitoPreSignupEvent(event);

  const pureUserName = path(['pureUserName'], validationData);

  if (!pureUserName) {
    return context.done(JSON.stringify({
      errorType: 'username validation error',
      errorMessage: 'pureUserName is missing in validationData',
    }), event);
  }

  const offlineValidationMsg = user.validateUserNameOffline(pureUserName);

  if (offlineValidationMsg) {
    return context.done(JSON.stringify({
      errorType: 'username validation error',
      errorMessage: offlineValidationMsg
    }), event);
  }

  if (attributes['custom:type'] === 'parent') {
    let errorMessage;
    try {
      if (await user.checkHasParentWithGivenEmail(attributes.email)) {
        errorMessage = 'This email is already registered';
      }
    } catch (e) {
      errorMessage = e.toString();
    }

    if (errorMessage) {
      return context.done(JSON.stringify({
        errorType: 'email validation error',
        errorMessage
      }), event);
    }
  }

  event.response.autoConfirmUser = true; // eslint-disable-line

  return context.done(null, event);
}

export default { preSignup }; // Add this for test
