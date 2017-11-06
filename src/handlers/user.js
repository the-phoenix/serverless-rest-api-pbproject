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
  try {
    const { params, currentUser, body } = parseEvent(event);
    const userId = params.userId || currentUser.userId;
    if (currentUser.type === 'parent') {
      callback(null, failure(new Error('No jobs for parent'), 400));
      return;
    }

    const ctrlParams = [
      userId, params.familyId, body.lastEvaluatedKey, body.limit
    ];

    console.log('HEY', ctrlParams);

    const data = await job.listByFamilyMember(...ctrlParams);

    if (!data) {
      callback(null, failure(new Error('No jobs existing'), 404));
    } else {
      callback(null, success(JSON.stringify(data)));
    }
  } catch (e) {
    console.log('Error from family.listJobs', e);
    callback(null, failure(e));
  }
}

export default { getMe, listJobs };
