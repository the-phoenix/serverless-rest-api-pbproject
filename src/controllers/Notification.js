import Boom from 'boom';
import * as R from 'ramda';
import NotiModel from 'models/Notification';
import FamilyModel from 'models/Family';
import UserModel from 'models/User';
import WithdrawalModel from 'models/Withdrawal';
import JobModel from 'models/Job';
import strFormat from 'string-template';
import { AVAILABLE_NOTIFICATIONS } from 'utils/noti';

export default class NotiController {
  constructor() {
    this.noti = new NotiModel();
    this.family = new FamilyModel();
    this.user = new UserModel();
    this.job = new JobModel();
    this.withdrawal = new WithdrawalModel();
  }

  async markOneAsRead(notiId) {
    const notiData = await this.noti.fetchById(notiId);

    return this.noti.markOneAsRead(notiData);
  }

  listByUser(userId, lastEvaluatedKey, limit) {
    return this.noti.fetchByUser(userId, lastEvaluatedKey, limit);
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
          ...R.pick(['amount', 'issuedBy'], params),
          text: strFormat(inappMessage, params)
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
    let targetUserIds = await this._getUserIdsFromFamily(familyId, 'all');

    // prevent send notification to issuedBy
    targetUserIds = R.filter(userId => userId !== newMemberId, targetUserIds);

    return this._createInppNotifications(targetUserIds,
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
      targetUserIds = await this._getUserIdsFromFamily(job.familyId, 'parent');
    } else if (['START_DECLINED', 'START_APPROVED', 'FINISH_DECLINED', 'PAID'].includes(status)) {
      targetUserIds = [job.childUserId];
    } else {
      throw Boom.badImplementation('Can\'t recognize job status');
    }

    return this._createInppNotifications(targetUserIds, {
      issuedBy: lastHistory.issuedBy,
      amount: job.jobSummary.price,
      title: job.jobSummary.title,
      familyId: job.familyId
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
      familyId: withdrawal.familyId
    }, snsMessage);
  }
}
