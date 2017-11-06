import { success, failure } from 'utils/response';
import parseEvent from 'utils/parser';
import FamilyController from 'controllers/Family';
import JobController from 'controllers/Job';

const family = new FamilyController();
const job = new JobController();

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

export async function listJobs(event, context, callback) {
  let response;

  try {
    const { params, currentUser, body } = parseEvent(event);
    if (currentUser.type === 'child') {
      response = failure(new Error('Only parent can get family data'), 400);
      return;
    }

    const ctrlParams = [
      currentUser.userId, params.familyId, body.lastEvaluatedKey, body.limit
    ];

    const data = await job.listByFamily(...ctrlParams);

    if (!data) {
      response = failure(new Error('No jobs existing'), 404);
    } else {
      response = success(JSON.stringify(data));
    }
  } catch (e) {
    console.log('Error from family.listJobs', e);
    response = failure(e);
  }

  callback(null, response);
}

export default {
  get, create, join, listJobs
};
