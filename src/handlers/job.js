import Boom from 'boom';
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
      throw Boom.notFound('Not existing job');
    }

    response = success(JSON.stringify(data));
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
      throw Boom.badRequest({
        errorType: 'validation error',
        errorMessage: error.details,
      });
    } else if (currentUser.type === 'parent' && !body.childUserId) {
      throw Boom.badRequest({
        errorType: 'validation error',
        errorMessage: 'childUserId is required',
      });
    }

    const created = await job.create(currentUser, body);

    response = success(JSON.stringify(created), true);
  } catch (e) {
    console.log('Error from create', e);
    response = failure(e);
  }

  callback(null, response);
}

export async function updateStatus(event, context, callback) {
  let response;

  try {
    const { currentUser, body, params } = parseEvent(event);

    const schemaError = checkUpdateJobStatusSchema(body);
    if (schemaError.error) {
      throw failure(Boom.badRequest({
        errorType: 'validation error',
        errorMessage: schemaError.error.details,
      }));
    }

    const updated = await job.safeUpdateStatus(currentUser, params.jobId, body);
    response = success(JSON.stringify(updated));
  } catch (e) {
    console.log('Error from job.updateStatus', e);
    response = failure(e);
  }

  callback(null, response);
}

export default { get, create, updateStatus };
