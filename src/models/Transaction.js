import { pick } from 'ramda';
import uuidv1 from 'uuid/v1';
import dbClient from 'utils/db-client';

const TRANSACTION_TABLENAME = 'Transactions';

export default class TransactionModel {
  constructor() {
    this.dbClient = dbClient;
  }

  fetchByFamilyId(familyId, lastEvaluatedKey, limit = 10) {
    const params = {
      TableName: TRANSACTION_TABLENAME,
      Limit: limit,
      ScanIndexForward: false,
      IndexName: 'familyId-created-index',
      KeyConditionExpression: 'familyId = :hkey',
      ExpressionAttributeValues: {
        ':hkey': familyId
      },
      ExclusiveStartKey: lastEvaluatedKey
    };

    return this
      .dbClient('query', params)
      .then(data => ({ ...data, Limit: limit }));
  }

  fetchByFamilyMember(familyId, userId, lastEvaluatedKey, limit = 10) {
    const params = {
      TableName: TRANSACTION_TABLENAME,
      Limit: limit,
      ScanIndexForward: false,
      KeyConditionExpression: 'familyId = :hkey AND begins_with(childUserId__createdTimestamp, :rkey)',
      ExpressionAttributeValues: {
        ':hkey': familyId,
        ':rkey': userId
      },
      ExclusiveStartKey: lastEvaluatedKey
    };

    return this.dbClient('query', params);
  }

  _create({
    familyId, description, childUserId, balanceAfter, amount, meta
  }) {
    const now = new Date();
    const timestamp = now.getTime();
    const params = {
      TableName: TRANSACTION_TABLENAME,
      Item: {
        id: uuidv1(),
        familyId,
        description,
        childUserId,
        balanceAfter,
        amount,
        created: now.toISOString(),
        childUserId__createdTimestamp: `${childUserId}__${timestamp}`,
        meta
      }
    };

    return this.dbClient('put', params).then(() => params.Item);
  }

  createFromJobCompletion(balanceAfter, completedJob) {
    const params = {
      ...pick(['familyId', 'childUserId'], completedJob),
      description: completedJob.jobSummary.title,
      amount: completedJob.jobSummary.price,
      balanceAfter,
      meta: {
        referenceTable: 'Jobs',
        referenceId: completedJob.id
      }
    };

    return this._create(params);  // eslint-disable-line
  }

  createFromWithdrawal(balanceAfter, approvedWithdrawal) {
    const params = {
      ...pick(['familyId', 'childUserId'], approvedWithdrawal),
      description: 'Cash Request',
      amount: approvedWithdrawal.amount,
      balanceAfter,
      meta: {
        referenceTable: 'Withdrawals',
        referenceId: approvedWithdrawal.id
      }
    };

    return this._create(params);  // eslint-disable-line
  }
}
