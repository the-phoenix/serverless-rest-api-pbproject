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

  async _getUserIdsFromFamily(familyId, wantedType) {
    const fms = await this.family.fetchMembersByFamilyId(familyId);
    const mapUserIdFn = R.map(R.prop('userId'));

    if (wantedType === 'parent' || wantedType === 'child') {
      return R.compose(
        mapUserIdFn,
        R.filter(R.pathEq(['userSummary', 'type'], wantedType))
      )(fms);
    }

    return mapUserIdFn(fms);
  }

  async _createInppNotifications(targetUserIds, params, snsMessage) {
    const inappMessage = AVAILABLE_NOTIFICATIONS[snsMessage.content].inapp;

    const createSingleNotiFN = userId =>
      this.noti.create(
        userId,
        {
          text: strFormat(inappMessage, params),
          ...R.pick(['amount, issuedBy'], params)
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
    let targetUserIds = await this._getUserIdsFromFamily(job.familyId, 'all'); // eslint-disable-line

    // prevent send notification to issuedBy
    targetUserIds = R.filter(user => user.userId !== newMember.userId, targetUserIds);

    return this._createInppNotifications(targetUserIds, // eslint-disable-line
      {
        issuedBy: newMemberId,
        username: newMember.username,
        familyId,
      }, snsMessage
    );
  }

  async notifyJob(jobId, snsMessage) {
    const job = await this.job.fetchById(jobId);

    let targetUserIds;
    const { status } = job;
    const lastHistory = R.last(job.history);

    if (['CREATED_BY_CHILD', 'FINISHED', 'STARTED'].includes(status)) {
      targetUserIds = await this._getUserIdsFromFamily(job.familyId, 'parent'); // eslint-disable-line
    } else if (['START_DECLINED', 'START_APPROVED', 'FINISH_DECLINED', 'PAID'].includes(status)) {
      targetUserIds = [job.childUserId];
    } else {
      throw Boom.badImplementation('Can\'t recognize job status');
    }

    return this._createInppNotifications(targetUserIds, { // eslint-disable-line
      issuedBy: lastHistory.issuedBy,
      amount: job.jobSummary.price,
      title: job.jobSummary.title,
    }, snsMessage);
  }

  async notifyWithdrawal(withdrawalId, snsMessage) {
    const withdrawal = await this.withdrawal.fetchById(withdrawalId);

    let targetUserIds;
    const { status } = withdrawal;
    const lastHistory = R.last(withdrawal.history);

    if (status === 'APPROVED') {
      targetUserIds = [withdrawal.childUserId];
    } else if (status === 'CREATED_BY_CHILD') {
      targetUserIds = await this._getUserIdsFromFamily(withdrawal.familyId, 'parent'); // eslint-disable-line
    } else {
      // todos: check when withdrawal request is rejected or canceled
      throw Boom.badImplementation('Can\'t recognize withdrawal status');
    }

    return this._createInppNotifications(targetUserIds, { // eslint-disable-line
      issuedBy: lastHistory.issuedBy,
      amount: withdrawal.amount,
    }, snsMessage);
  }
}
