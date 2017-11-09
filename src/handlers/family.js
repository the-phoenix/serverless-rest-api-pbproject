import Boom from 'boom';
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
    const data = await family.get(params.familyId, queryParams.scope);

    if (!data) {
      throw Boom.notFound('Not existing family');
    }

    response = success(JSON.stringify(data));
  } catch (e) {
    console.log('Error from getFamily', e);
    response = failure(e);
  }

  callback(null, response);
}


export async function create(event, context, callback) {
  let response;

  try {
    const { currentUser } = parseEvent(event);

    if (currentUser.type !== 'parent') {
      throw Boom.badRequest('Only Parent user can create family');
    }

    const data = await family.create(currentUser);

    response = success(JSON.stringify(data), true);
  } catch (e) {
    console.log('Error from createFamily', e);
    response = failure(e);
  }

  callback(null, response);
}

export async function join(event, context, callback) {
  let response;

  try {
    const { currentUser, body } = parseEvent(event);

    if (!body.familyId) {
      throw Boom.badRequest('familyId is missing in request body');
    }

    await family.join(currentUser, body.familyId);

    response = success(JSON.stringify({ message: 'joined ' }));
  } catch (e) {
    console.log('Error from join', e);
    response = failure(e);
  }

  callback(null, response);
}

export async function listJobs(event, context, callback) {
  let response;

  try {
    const { params, currentUser, body } = parseEvent(event);
    if (currentUser.type === 'child') {
      throw Boom.badRequest('Only parent can get family data');
    }

    const ctrlParams = [
      currentUser.userId, params.familyId, body.lastEvaluatedKey, body.limit
    ];

    const data = await job.listByFamily(...ctrlParams);

    if (!data) {
      throw Boom.notFound('No jobs existing');
    }

    response = success(JSON.stringify(data));
  } catch (e) {
    console.log('Error from family.listJobs', e);
    response = failure(e);
  }

  callback(null, response);
}

export default {
  get, create, join, listJobs
};
