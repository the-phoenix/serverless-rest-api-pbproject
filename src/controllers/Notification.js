import Boom from 'boom';
import * as R from 'ramda';
import NotiModel from 'models/Notification';
import FamilyModel from 'models/Family';
import UserModel from 'models/User';
import JobModel from 'models/Job';
import strFormat from 'string-template';
import { AVAILABLE_NOTIFICATIONS } from 'utils/noti';

export default class NotiController {
  constructor() {
    this.noti = new NotiModel();
    this.family = new FamilyModel();
    this.user = new UserModel();
    this.job = new JobModel();
  }

  markOneAsRead(notiId) {
    return this.noti.markOneAsRead(notiId);
  }

  listByUser(userId, lastEvaluatedKey, limit) {
    return this.job.fetchByUser(userId, lastEvaluatedKey, limit);
  }

  async _createInppNotifications(target, params, snsMessage) {
    let targetUserIds;
    const inappMessage = AVAILABLE_NOTIFICATIONS[snsMessage.message].inapp;

    if (target === 'parents' || target === 'childs' || target === 'family') {
      let targetUsers;
      const fms = await this.family.fetchMembersByFamilyId(params.familyId);

      if (target === 'family') {
        targetUsers = fms;
      } else {
        targetUsers = R.filter(R.pathEq(['userSummary', 'type'], target));
      }

      targetUserIds = R.map(R.prop('userId'), targetUsers);
    } else {
      targetUserIds = target;
    }

    const createSingleNotiFN = userId =>
      this.noti.create(
        userId,
        {
          text: strFormat(inappMessage, params),
          ...R.pick(['amount, issuedBy'])
        },
        params.familyId,
        snsMessage
      );

    // todos: exclude issuedBy from targetUserIds

    return targetUserIds.length
      ? Promise.all(targetUserIds.map(createSingleNotiFN))
      : Promise.resolve(true);
  }

  async notifyNewFamilyMemberJoined(familyId, newMemberId, snsMessage) {
    const newMember = await this.user.fetchById(newMemberId);

    return this._createInppNotifications('family', { // eslint-disable-line
      issuedBy: newMemberId,
      username: newMember.username
    }, snsMessage);
  }

  async notifyJob(jobId, snsMessage) {
    const job = await this.job.fetchById(jobId);

    let target;
    const { status } = job;
    const lastHistory = R.last(job.history);

    if (['CREATED_BY_CHILD', 'FINISHED', 'STARTED'].includes(status)) {
      target = 'parents';
    } else if (['START_DECLINED', 'START_APPROVED', 'FINISH_DECLINED', 'PAID'].includes(status)) {
      target = [job.childUserId];
    } else {
      throw Boom.badImplementation('Can\'t recognize job status');
    }

    return this._createInppNotifications(target, { // eslint-disable-line
      issuedBy: lastHistory.issuedBy,
      amount: job.jobSummary.price,
      title: job.jobSummary.title,
    }, snsMessage);
  }

  async notifyWithdrawal(withdrawalId, snsMessage) {
    const withdrawal = await this.withdrawal.fetchById(withdrawalId);

    let target;
    const { status } = withdrawal;
    const lastHistory = R.last(withdrawal.history);

    if (status === 'APPROVED') {
      target = [withdrawal.childUserId];
    } else if (status === 'PENDING') {
      target = 'parents';
    } else {
      // todos: check when withdrawal request is rejected or canceled
      throw Boom.badImplementation('Can\'t recognize withdrawal status');
    }

    return this._createInppNotifications(target, { // eslint-disable-line
      issuedBy: lastHistory.issuedBy,
      amount: withdrawal.amount,
    }, snsMessage);
  }

  // async notify
}
