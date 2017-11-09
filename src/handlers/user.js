import Boom from 'boom';
import { success, failure } from 'utils/response';
import parseEvent from 'utils/parser';
import FamilyController from 'controllers/Family';
import JobController from 'controllers/Job';

const family = new FamilyController();
const job = new JobController();

export async function getMe(event, context, callback) {
  let response;
  console.log('Get event obj', JSON.stringify(event));

  try {
    const { currentUser } = parseEvent(event);

    const familyInfo = await family.fetchByUserId(currentUser.userId);
    currentUser.family = familyInfo;

    response = success(JSON.stringify(currentUser));
  } catch (e) {
    console.log('Error from getMe', e);
    response = failure(e);
  }

  callback(null, response);
}

export async function remove(event, context, callback) {
  callback(null, {
    statusCode: 200,
    body: 'Not implemented yet',
  });
}

export async function listJobs(event, context, callback) {
  let response;

  try {
    const { params, currentUser, body } = parseEvent(event);
    const userId = params.userId || currentUser.userId;
    if (currentUser.type === 'parent') {
      throw Boom.badRequest('Parent doesn\'t have jobs');
    }

    const ctrlParams = [
      userId, params.familyId, body.lastEvaluatedKey, body.limit
    ];

    const data = await job.listByFamilyMember(...ctrlParams);

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

export default { getMe, listJobs };
