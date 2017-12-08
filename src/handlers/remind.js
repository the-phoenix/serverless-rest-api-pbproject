import Boom from 'boom';
import * as R from 'ramda';
import { success, failure } from 'utils/response';
import { parseAPIGatewayEvent } from 'utils/parser';
import FamilyController from 'controllers/Family';
import UserController from 'controllers/User';
import {
  checkforgotUsernameSchema,
  checkforgotPasswordSchema
} from 'utils/validation';
import {
  sendFamilyUsernamesReminder,
  sendForgotPincodeReminder
} from 'utils/mailer';

const family = new FamilyController();
const user = new UserController();

export async function forgotUsername(event, context, callback) {
  let response;

  try {
    const { body } = parseAPIGatewayEvent(event);
    const validationError = checkforgotUsernameSchema(body);

    if (validationError) {
      throw Boom.preconditionFailed(validationError);
    }

    const data = await family.getFamilyUsernames(body.email);
    const emailSendPromises = data.map((users) => {
      const usernames = users.map(one => one.username);

      return sendFamilyUsernamesReminder(body.email, usernames.join('<br/>'));
    });

    const emailResp = await Promise.all(emailSendPromises);
    response = success(emailResp);
  } catch (e) {
    response = failure(e, event);
  }

  callback(null, response);
}

export async function forgotPincode(event, context, callback) {
  let response;

  try {
    const { body } = parseAPIGatewayEvent(event);
    const validationError = checkforgotPasswordSchema(body);

    if (validationError) {
      throw Boom.preconditionFailed(validationError);
    }

    const wantedUser = await user.getByPreferredUsername(body.username);
    if (!wantedUser) {
      throw Boom.notFound('Not existing user');
    }

    const getAttribValue = attribName => R.compose(
      R.path(['Value']),
      R.find(R.propEq('Name', attribName)),
    );
    const userType = getAttribValue('custom:type')(wantedUser.Attributes);
    const email = getAttribValue('email')(wantedUser.Attributes);

    if (userType === 'parent') {
      throw Boom.badRequest('parent user is not allowed.');
    } else if (userType === 'child' && !email) {
      throw Boom.badRequest('child user with no family. please contact pennybox admin.');
    }

    const emailResp = await sendForgotPincodeReminder(email, body.username);

    response = success(emailResp);
  } catch (e) {
    response = failure(e, event);
  }

  callback(null, response);
}

export default { forgotUsername, forgotPincode };
