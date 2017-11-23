import Boom from 'boom';
import { success, failure } from 'utils/response';
import parseEvent from 'utils/parser';
import TransactionController from 'controllers/Transaction';

const transaction = new TransactionController();

export async function get(event, context, callback) {
  let response;

  try {
    const { params } = parseEvent(event);
    const data = await transaction.get(params.transactionId);

    if (!data) {
      throw Boom.notFound('Not existing transaction history');
    }

    response = success(JSON.stringify(data));
  } catch (e) {
    console.log('Error from transaction.get', e);
    response = failure(e);
  }

  callback(null, response);
}

export async function listByFamily(event, context, callback) {
  let response;

  try {
    const { params, currentUser, body } = parseEvent(event);
    if (currentUser.type === 'child') {
      throw Boom.badRequest('Only parent can get family data');
    }

    const ctrlParams = [
      currentUser.userId, params.familyId, body.lastEvaluatedKey, body.limit
    ];

    const data = await transaction.listByFamily(...ctrlParams);

    if (!data) {
      throw Boom.notFound('No transaction history existing');
    }

    response = success(JSON.stringify(data));
  } catch (e) {
    console.log('Error from transaction.listByFamily', e);
    response = failure(e);
  }

  callback(null, response);
}

export async function listByFamilyMember(event, context, callback) {
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

    const data = await transaction.listByFamilyMember(...ctrlParams);

    if (!data) {
      throw Boom.notFound('No transaction history existing');
    }

    response = success(JSON.stringify(data));
  } catch (e) {
    console.log('Error from transaction.listByFamilyMember', e);
    response = failure(e);
  }

  callback(null, response);
}

export default {
  get, listByFamilyMember, listByFamily
};
