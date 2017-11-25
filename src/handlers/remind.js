import Boom from 'boom';
import { success, failure } from 'utils/response';
import parseEvent from 'utils/parser';
import FamilyController from 'controllers/Family';
import {
  checkGetFamilyMemberUsernamesSchema
} from 'utils/validation';
import {
  sendFamilyUsernamesReminder
} from 'utils/mailer';

const family = new FamilyController();

export async function forgotUsername(event, context, callback) {
  let response;

  try {
    const { body } = parseEvent(event);
    const { error } = checkGetFamilyMemberUsernamesSchema(body);

    if (error) {
      throw Boom.badRequest({
        errorType: 'validation error',
        errorMessage: error.details,
      });
    }

    const data = await family.getFamilyUsernames(body.email);

    const usernames = data.map(one => one.username);
    await sendFamilyUsernamesReminder(body.email, usernames.join('<br/>'));

    response = success('Email sent');
  } catch (e) {
    response = failure(e);
  }

  callback(null, response);
}

export default { forgotUsername };
