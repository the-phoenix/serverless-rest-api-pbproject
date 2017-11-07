import { success, failure } from 'utils/response';
import parseEvent from 'utils/parser';
import JobController from 'controllers/Job';
import {
  checkCreateJobDataSchema,
  checkUpdateJobStatusSchema,
} from 'utils/validation';

const job = new JobController();

export async function get(event, context, callback) {
  let response;

  try {
    const { params } = parseEvent(event);
    const data = await job.get(params.jobId);

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

  try {
    const { currentUser, body } = parseEvent(event);
    const { error } = checkCreateJobDataSchema(body);

    if (error) {
      response = failure({
        errorType: 'validation error',
        errorMessage: error.details,
      }, 400);
    } else if (currentUser.type === 'parent' && !body.childUserId) {
      response = failure({
        errorType: 'validation error',
        errorMessage: 'childUserId is required',
      }, 400);
    } else {
      const created = await job.create(currentUser, body);

      response = success(JSON.stringify(created), true);
    }
  } catch (e) {
    console.log('Error from create', e);

    response = failure(e);
  }

  callback(null, response);
}

export async function updateStatus(event, context, callback) {
  try {
    const { currentUser, body, params } = parseEvent(event);

    const schemaError = checkUpdateJobStatusSchema(body);
    if (schemaError.error) {
      callback(null, failure({
        errorType: 'validation error',
        errorMessage: schemaError.error.details,
      }, 400));
      return;
    }

    const updated = await job.safeUpdateStatus(currentUser, params.jobId, body);
    callback(null, success(JSON.stringify(updated)));
  } catch (e) {
    console.log('Error from job.updateStatus', e);

    if (e.statusCode) {
      callback(null, failure(e.body, e.statusCode));
    } else {
      callback(null, failure(e));
    }
  }
}

export default { get, create, updateStatus };
