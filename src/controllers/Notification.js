import Boom from 'boom';
import * as R from 'ramda';
import NotiModel from 'models/Notification';
import FamilyModel from 'models/Family';
import UserModel from 'models/User';
import WithdrawalModel from 'models/Withdrawal';
import JobModel from 'models/Job';
import strFormat from 'string-template';

import { AVAILABLE_NOTIFICATIONS, sendPush } from 'utils/noti/index';

export default class NotiController {
  constructor() {
    this.noti = new NotiModel();
    this.family = new FamilyModel();
    this.user = new UserModel();
    this.job = new JobModel();
    this.withdrawal = new WithdrawalModel();
  }

  async markOneAsRead(notiId, currentUser) {
    const notiData = await this.noti.fetchById(notiId);
    if (notiData.userId !== currentUser.userId) {
      throw Boom.badRequest('Not allowed to update other\'s notification status');
    }

    return this.noti.markOneAsRead(notiData);
  }

  listByUser(userId, lastEvaluatedKey, limit) {
    return this.noti.fetchByUser(userId, lastEvaluatedKey, limit);
  }

  async _getUsersFromFamily(familyId, wantedType) {
    const fms = await this.family.fetchMembersByFamilyId(familyId);

    if (wantedType === 'parent' || wantedType === 'child') {
      return R.compose(
        R.filter(R.pathEq(['userSummary', 'type'], wantedType))
      )(fms);
    }

    return fms;
  }

  _sendPushNotification(targetFamilyMember, params, snsOriginMessage) { // eslint-disable-line
    const pushMessage = AVAILABLE_NOTIFICATIONS[snsOriginMessage.content].push;

    if (!pushMessage) {
      return Promise.resolve(`No push message defined for ${snsOriginMessage.content}`);
    } else if (!targetFamilyMember.userSummary.deviceTokens) {
      return Promise.resolve(`No device token for ${targetFamilyMember['cognito:username']}`);
    }

    return sendPush(targetFamilyMember.userSummary.deviceTokens, strFormat(pushMessage, params));
  }

  _createInppNotification(targetFamilyMember, params, snsOriginMessage) {
    const inappMessage = AVAILABLE_NOTIFICATIONS[snsOriginMessage.content].inapp;

    return this.noti.create(
      targetFamilyMember.userId,
      {
        ...R.pick(['amount', 'issuedBy'], params),
        text: strFormat(inappMessage, params)
      },
      params.familyId,
      snsOriginMessage
    );
  }

  sendNotifications(targetFamilyMembers, params, snsOriginMessage) {
    return Promise.all(
      targetFamilyMembers.map(
        targetFamilyMember => Promise.all([
          this._sendPushNotification(targetFamilyMember, params, snsOriginMessage),
          this._createInppNotification(targetFamilyMember, params, snsOriginMessage),
        ])
      )
    );
  }

  async notifyNewFamilyMemberJoined(familyId, newMemberId, snsOriginMessage) {
    const newMember = await this.user.fetchById(newMemberId);
    let targetFamilyMembers = await this._getUsersFromFamily(familyId, 'all');

    // prevent send notification to issuedBy
    targetFamilyMembers = R.filter(({ userId }) => userId !== newMemberId, targetFamilyMembers);

    return this.sendNotifications(
      targetFamilyMembers,
      {
        issuedBy: newMemberId,
        username: newMember.username,
        familyId,
      }, snsOriginMessage
    );
  }

  async notifyJob(jobId, snsOriginMessage) {
    const job = await this.job.fetchById(jobId);

    let targetFamilyMembers;
    const { status } = job;
    const lastHistory = R.last(job.history);
    const { username } = await this.user.fetchById(lastHistory.issuedBy);

    if (['CREATED_BY_CHILD', 'FINISHED', 'STARTED'].includes(status)) {
      targetFamilyMembers = await this._getUsersFromFamily(job.familyId, 'parent');
    } else if (['START_DECLINED', 'START_APPROVED', 'FINISH_DECLINED', 'PAID'].includes(status)) {
      targetFamilyMembers = [
        await this.user.fetchById(job.childUserId)
      ];
    } else {
      throw Boom.badImplementation('Can\'t recognize job status');
    }

    return this.sendNotifications(
      targetFamilyMembers,
      {
        username,
        issuedBy: lastHistory.issuedBy,
        amount: job.jobSummary.price,
        title: job.jobSummary.title,
        familyId: job.familyId
      }, snsOriginMessage);
  }

  async notifyWithdrawal(withdrawalId, snsOriginMessage) {
    const withdrawal = await this.withdrawal.fetchById(withdrawalId);

    let targetFamilyMembers;
    const { status } = withdrawal;
    const lastHistory = R.last(withdrawal.history);
    const { username } = await this.user.fetchById(lastHistory.issuedBy);

    if (status === 'APPROVED') {
      targetFamilyMembers = [
        await this.user.fetchById(withdrawal.childUserId)
      ];
    } else if (status === 'CREATED_BY_CHILD') {
      targetFamilyMembers = await this._getUsersFromFamily(withdrawal.familyId, 'parent'); // eslint-disable-line
    } else {
      // todos: check when withdrawal request is rejected or canceled
      throw Boom.badImplementation('Can\'t recognize withdrawal status');
    }

    return this.sendNotifications(
      targetFamilyMembers,
      { // eslint-disable-line
        username,
        issuedBy: lastHistory.issuedBy,
        amount: withdrawal.amount,
        familyId: withdrawal.familyId
      }, snsOriginMessage
    );
  }
}
