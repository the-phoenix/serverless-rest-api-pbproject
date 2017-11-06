import { success, failure } from 'utils/response';
import parseEvent from 'utils/parser';
import JobController from 'controllers/Job';
import { pick } from 'ramda';

const job = new JobController();

export async function get(event, context, callback) {
  let response;

  try {
    const { params } = parseEvent(event);
    const data = await job.get(params.id);

    if (!data) {
      response = failure(new Error('Not existing job'), 404);
    } else {
      response = success(JSON.stringify(data));
    }
  } catch (e) {
    console.log('Error from getJob', e);
    response = failure(e);
  }

  callback(null, response);
}

export async function create(event, context, callback) {
  let response;

  const now = new Date();
  const { data, currentUser } = parseEvent(event);
  // todos: check if currentUser is member of given familyId
  let jobData = {
    ...pick(['familyId', 'jobSummary'], data),
    modified: now.toISOString(),
    modifiedTimestamp__familyId: `${now.getTime()}__${data.familyId}`
  };

  if (currentUser.type === 'parent') {
    jobData = {
      ...jobData,
      status: 'CREATED_BY_PARENT',
      childUserId: data.childUserId,
      childUserId__modifiedTimestamp: `${data.childUserId}__${now.getTime()}`
    };
  } else {
    jobData = {
      ...jobData,
      status: 'CREATED_BY_CHILD',
      childUserId: currentUser.userId,
      childUserId__modifiedTimestamp: `${data.childUserId}__${now.getTime()}`
    };
  }
}

export default { get };
