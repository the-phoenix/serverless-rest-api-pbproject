import { success, failure } from 'utils/response';
import parseEvent from 'utils/parser';
import FamilyController from 'controllers/Family';

const family = new FamilyController();

export async function get(event, context, callback) {
  let response;
  // console.log('HEY Show me event', JSON.stringify(event));
  try {
    const { params, queryParams } = parseEvent(event);
    const data = await family.get(params.id, queryParams.scope);
    if (!data) {
      response = failure(new Error('Not existing family'), 404);
    } else {
      response = success(JSON.stringify(data));
    }
  } catch (e) {
    console.log('Error from getFamily', e);
    response = failure(e);
  }

  callback(null, response);
}

export async function join(event, context, callback) {
  try {
    const { body } = parseEvent(event);

    console.log('hey', event.requestContext.authorizer);
    const data = await family.join(body.targetMemberToken);

    callback(null, success(data));
  } catch (e) {
    console.log('Error from join', e);
    callback(null, failure({ status: 'failure', message: e.toString() }));
  }
}

export default { get, join }; // Add this for test
