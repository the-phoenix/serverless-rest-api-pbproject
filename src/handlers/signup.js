import * as R from 'ramda';
import { parseCognitoEvent } from 'utils/parser';
import UserController from 'controllers/User';
import {
  sendWelcome
} from 'utils/mailer';

const user = new UserController();

export async function preSignup(event, context) {
  const {
    attributes,
    validationData,
  } = parseCognitoEvent(event);

  const pureUserName = R.path(['pureUserName'], validationData);

  if (!pureUserName) {
    return context.done(JSON.stringify({
      errorType: 'validation error',
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

  try {
    if (await user.getByPreferredUsername(pureUserName)) {
      return context.done(JSON.stringify({
        errorType: 'username validation error',
        errorMessage: 'This username is already registered'
      }), event);
    } else if (attributes['custom:type'] === 'parent'
      && await user.checkHasParentWithGivenEmail(attributes.email)) {
      return context.done(JSON.stringify({
        errorType: 'email validation error',
        errorMessage: 'This email is already registered'
      }), event);
    }
  } catch (e) {
    return context.done(JSON.stringify({
      errorType: 'validation error',
      errorMessage: e.toString()
    }), event);
  }

  event.response.autoConfirmUser = true; // eslint-disable-line

  return context.done(null, event);
}

export async function postConfirmation(event, context) {
  const {
    attributes,
    userPoolId,
    cognitoUserName
  } = parseCognitoEvent(event);

  try {
    const getAttribValue = attribName => R.compose(
      R.path(['Value']),
      R.find(R.propEq('Name', attribName)),
    );
    const userType = getAttribValue('custom:type')(attributes);
    const email = getAttribValue('email')(attributes);

    await user.postConfirmation(cognitoUserName, attributes, userPoolId);
    if (userType === 'parent') {
      console.log('Welcome email sent', await sendWelcome(email));
    }
  } catch (e) {
    return context.done(JSON.stringify({
      errorType: 'postConfirmation error',
      errorMessage: e.toString()
    }), event);
  }

  return context.done(null, event);
}

export default { preSignup, postConfirmation }; // Add this for test
