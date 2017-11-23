import Boom from 'boom';
import { success, failure } from 'utils/response';
import parseEvent from 'utils/parser';
import FamilyController from 'controllers/Family';
import {
  checkGetFamilyMemberUsernamesSchema
} from 'utils/validation';

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

    const data = await family.emailFamilyUsernames(body.email);

    response = success(JSON.stringify(data), true);
  } catch (e) {
    console.log('Error from getFamilyMemberUsernames', e);
    response = failure(e);
  }

  callback(null, response);
}

export default { forgotUsername };
