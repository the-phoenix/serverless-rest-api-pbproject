import Boom from 'boom';
import { success, failure } from 'utils/response';
import parseEvent from 'utils/parser';
import WithdrawalController from 'controllers/Withdrawal';
import {
  checkCreateWithdrawalDataSchema,
  checkUpdateWithdrawalStatusSchema,
} from 'utils/validation';

const withdrawal = new WithdrawalController();

export async function get(event, context, callback) {
  let response;

  try {
    const { params } = parseEvent(event);
    const data = await withdrawal.get(params.withdrawalId);

    if (!data) {
      throw Boom.notFound('Not existing job');
    }

    response = success(data);
  } catch (e) {
    response = failure(e);
  }

  callback(null, response);
}

export async function create(event, context, callback) {
  let response;

  try {
    const { currentUser, body } = parseEvent(event);
    const validationError = checkCreateWithdrawalDataSchema(body);

    if (validationError) {
      throw Boom.preconditionFailed(validationError);
    } else if (currentUser.type === 'parent' && !body.childUserId) {
      throw Boom.preconditionFailed('"childUserId" is required');
    }

    const created = await withdrawal.create(currentUser, body);

    response = success(created, true);
  } catch (e) {
    response = failure(e);
  }

  callback(null, response);
}

export async function updateStatus(event, context, callback) {
  let response;

  try {
    const { currentUser, body, params } = parseEvent(event);

    const schemaError = checkUpdateWithdrawalStatusSchema(body);
    if (schemaError.error) {
      throw Boom.badRequest(schemaError.error.details);
    }

    const updated = await withdrawal.safeUpdateStatus(currentUser, params.withdrawalId, body);
    response = success(updated);
  } catch (e) {
    response = failure(e);
  }

  callback(null, response);
}

export async function listByFamily(event, context, callback) {
  let response;

  try {
    const {
      params, currentUser, body, queryParams
    } = parseEvent(event);
    if (currentUser.type === 'child') {
      throw Boom.badRequest('Only parent can get family data');
    }

    const ctrlParams = [
      currentUser.userId,
      params.familyId,
      queryParams.status || 'pending',
      body.lastEvaluatedKey,
      body.limit
    ];

    const data = await withdrawal.listByFamily(...ctrlParams);

    if (!data) {
      throw Boom.notFound('No jobs existing');
    }

    response = success(data);
  } catch (e) {
    response = failure(e);
  }

  callback(null, response);
}

export async function listByFamilyMember(event, context, callback) {
  let response;

  try {
    const {
      params, currentUser, body, queryParams
    } = parseEvent(event);

    const userId = params.userId || currentUser.userId;
    if (currentUser.type === 'parent') {
      throw Boom.badRequest('Parent doesn\'t have jobs');
    }

    const ctrlParams = [
      userId,
      params.familyId,
      queryParams.status || 'pending',
      body.lastEvaluatedKey,
      body.limit
    ];

    const data = await withdrawal.listByFamilyMember(...ctrlParams);

    if (!data) {
      throw Boom.notFound('No withdrawal request existing');
    }

    response = success(data);
  } catch (e) {
    response = failure(e);
  }

  callback(null, response);
}

export default {
  get, create, updateStatus, listByFamilyMember, listByFamily
};
