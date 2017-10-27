import { success, failure } from 'utils/response';
import parseEvent from 'utils/parser';
import FamilyController from 'controllers/Family';

const family = new FamilyController();

export async function get(event, context, callback) {
  let response;

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

export async function create(event, context, callback) {
  try {
    const { currentUser } = parseEvent(event);

    if (currentUser.type !== 'parent') {
      return callback(null, failure(new Error('Only Parent user can create family'), 400));
    }

    const data = await family.create(currentUser);

    return callback(null, success(JSON.stringify(data), true));
  } catch (e) {
    console.log('Error from createFamily', e);

    return callback(null, failure(e));
  }
}

export async function join(event, context, callback) {
  try {
    const { currentUser, body } = parseEvent(event);

    if (!body.familyId) {
      return callback(null, failure(new Error('familyId is missing'), 400));
    }

    await family.join(currentUser, body.familyId);

    return callback(null, success(JSON.stringify({ message: 'joined ' })));
  } catch (e) {
    console.log('Error from join', e);

    return callback(null, failure(e));
  }
}

export default { get, create, join }; // Add this for test
