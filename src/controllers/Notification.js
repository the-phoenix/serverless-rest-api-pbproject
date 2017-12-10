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

  _sendPushNotification(targetUser, params, snsOriginMessage) { // eslint-disable-line
    const pushMessage = AVAILABLE_NOTIFICATIONS[snsOriginMessage.content].push;
    const deviceTokens = targetUser.deviceTokens || R.path(['userSummary', 'deviceTokens'], targetUser);

    if (!pushMessage) {
      return Promise.resolve(`No push message defined for ${snsOriginMessage.content}`);
    } else if (!deviceTokens || !deviceTokens.length) {
      return Promise.resolve(`No device token for ${targetUser.userId}`);
    }

    return sendPush(deviceTokens, strFormat(pushMessage, params));
  }

  _createInppNotification(targetUser, params, snsOriginMessage) {
    const inappMessage = AVAILABLE_NOTIFICATIONS[snsOriginMessage.content].inapp;

    return this.noti.create(
      targetUser.userId,
      {
        ...R.pick(['amount', 'issuedBy'], params),
        text: strFormat(inappMessage, params)
      },
      params.familyId,
      snsOriginMessage
    );
  }

  sendNotifications(targetUsers, params, snsOriginMessage) {
    return Promise.all(
      targetUsers.map(
        targetUser => Promise.all([
          this._sendPushNotification(targetUser, params, snsOriginMessage),
          this._createInppNotification(targetUser, params, snsOriginMessage),
        ])
      )
    );
  }

  async notifyNewFamilyMemberJoined(familyId, newMemberId, snsOriginMessage) {
    const newMember = await this.user.fetchById(newMemberId);
    let targetUsers = await this._getUsersFromFamily(familyId, 'all');

    // prevent send notification to issuedBy
    targetUsers = R.filter(({ userId }) => userId !== newMemberId, targetUsers);

    return this.sendNotifications(
      targetUsers,
      {
        issuedBy: newMemberId,
        username: newMember.username,
        familyId,
      }, snsOriginMessage
    );
  }

  async notifyJob(jobId, snsOriginMessage) {
    const job = await this.job.fetchById(jobId);

    let targetUsers;
    const { status } = job;
    const lastHistory = R.last(job.history);
    const { username } = await this.user.fetchById(lastHistory.issuedBy);

    console.log('RECEIVED ACTION: ', snsOriginMessage.content);
    console.log('CURRENT JOB STATUS: ', status);

    if (['CREATED_BY_CHILD', 'FINISHED', 'STARTED'].includes(status)) {
      targetUsers = await this._getUsersFromFamily(job.familyId, 'parent');
    } else if (['START_DECLINED', 'START_APPROVED', 'FINISH_DECLINED', 'PAID'].includes(status)) {
      console.log('am i came here?', job.childUserId);
      targetUsers = [
        await this.user.fetchById(job.childUserId)
      ];
      console.log('so what i get', targetUsers);
    } else {
      throw Boom.badImplementation('Can\'t recognize job status');
    }

    return this.sendNotifications(
      targetUsers,
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

    let targetUsers;
    const { status } = withdrawal;
    const lastHistory = R.last(withdrawal.history);
    const { username } = await this.user.fetchById(lastHistory.issuedBy);

    if (status === 'APPROVED') {
      targetUsers = [
        await this.user.fetchById(withdrawal.childUserId)
      ];
    } else if (status === 'CREATED_BY_CHILD') {
      targetUsers = await this._getUsersFromFamily(withdrawal.familyId, 'parent'); // eslint-disable-line
    } else {
      // todos: check when withdrawal request is rejected or canceled
      throw Boom.badImplementation('Can\'t recognize withdrawal status');
    }

    return this.sendNotifications(
      targetUsers,
      { // eslint-disable-line
        username,
        issuedBy: lastHistory.issuedBy,
        amount: withdrawal.amount,
        familyId: withdrawal.familyId
      }, snsOriginMessage
    );
  }
}
