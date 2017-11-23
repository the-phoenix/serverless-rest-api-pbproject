import Boom from 'boom';
import { pick } from 'ramda';
import WithdrawalModel from 'models/Withdrawal';
import FamilyModel from 'models/Family';
import { isOffline } from 'utils/db-client';

import {
  checkAllowedWithdrawalStatusSafeUpdate as checkSafeStatus
} from 'utils/validation';

export default class WithdrawalController {
  constructor() {
    this.withdrawal = new WithdrawalModel();
    this.family = new FamilyModel();
  }

  async get(id) {
    const data = await this.withdrawal.fetchById(id);

    return data;
  }

  async listByFamily(userId, familyId, lastEvaluatedKey, limit) {
    // check if user is family member
    if (!(isOffline() || await this.family.checkIsFamilyMember(familyId, userId))) {
      throw Boom.badRequest('Disallowed to see other family\'s data');
    }

    return this.withdrawal.fetchByFamilyId(familyId, lastEvaluatedKey, limit);
  }

  async listByFamilyMember(userId, familyId, lastEvaluatedKey, limit) {
    // check if user is family member
    if (!(isOffline() || await this.family.checkIsFamilyMember(familyId, userId))) {
      throw Boom.badRequest('Disallowed to see other family\'s data');
    }

    return this.withdrawal.fetchByFamilyMember(familyId, userId, lastEvaluatedKey, limit);
  }

  async getAvailableBalance(familyId, childUserId) {
    const pendingAmount = await this.withdrawal.getPendingAmount(familyId, childUserId);
    const familyMemberInfo = await this.family.fetchMember(familyId, childUserId);

    return familyMemberInfo.userSummary.balance - pendingAmount;
  }

  async create(currentUser, reqParam) {
    const withdrawalData = pick(['familyId', 'amount', 'childUserId'], reqParam);

    // check if user is family member
    if (!(isOffline() ||
      await this.family.checkIsFamilyMember(withdrawalData.familyId, currentUser.userId)
    )) {
      throw Boom.badRequest('Disallowed to set other family\'s data');
    }

    // check if available to withdraw
    const availableBalance = await this
      .getAvailableBalance(withdrawalData.familyId, withdrawalData.childUserId);

    if (availableBalance < withdrawalData.amount) {
      throw Boom.badRequest('Not enough available balance');
    }

    let newWithdrawal = await this.withdrawal.create(currentUser.userId, withdrawalData);
    if (currentUser.type === 'parent') {
      newWithdrawal = await this.withdrawal.updateStatus(currentUser.userId, 'APPROVED', newWithdrawal);
    }

    return newWithdrawal;
  }

  async safeUpdateStatus(currentUser, withdrawalId, reqParam) {
    const withdrawalData = await this.withdrawal.fetchById(withdrawalId);

    if (!withdrawalData) {
      throw Boom.notFound('Not existing withdrawal request');
    }

    // check if user is family member
    if (!(isOffline() ||
      await this.family.checkIsFamilyMember(withdrawalData.familyId, currentUser.userId)
    )) {
      throw Boom.badRequest('Disallowed to set other family\'s data');
    }

    const safetyError = checkSafeStatus(currentUser.type, withdrawalData.status, reqParam.status);
    if (safetyError.error) {
      throw Boom.badRequest(safetyError.error.details);
    }

    const updatedWithdrawal = await this.withdrawal
      .updateStatus(currentUser.userId, reqParam.status, withdrawalData);

    if (updatedWithdrawal.status === 'APPROVED') {
      const { userSummary } = await this.family
        .updateFamilyMemberAfterWithdrawal(updatedWithdrawal);
      await this.transaction.createFromJobCompletion(userSummary.balance, updatedWithdrawal);
    }

    return updatedWithdrawal;
  }
}
