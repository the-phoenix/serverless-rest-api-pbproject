import { pick } from 'ramda';
import JobModel from 'models/Job';
import { isOffline } from 'utils/db-client';
import FamilyModel from 'models/Family';

export default class JobController {
  constructor() {
    this.job = new JobModel();
    this.family = new FamilyModel();
  }

  async get(id) {
    const data = await this.job.fetchById(id);

    return data;
  }

  async listByFamily(userId, familyId, lastEvaluatedKey, limit) {
    // check if user is family member
    if (!(isOffline() || await this.family.checkIsFamilyMember(familyId, userId))) {
      return Promise.reject(new Error('Disallowed to see other family\'s data'));
    }

    return this.job.fetchByFamilyId(familyId, lastEvaluatedKey, limit);
  }

  async listByFamilyMember(userId, familyId, lastEvaluatedKey, limit) {
    // check if user is family member
    if (!(isOffline() || await this.family.checkIsFamilyMember(familyId, userId))) {
      return Promise.reject(new Error('Disallowed to see other family\'s data'));
    }

    return this.job.fetchByFamilyMember(familyId, userId, lastEvaluatedKey, limit);
  }

  async create(currentUser, reqParam) {
    const now = new Date();
    let jobData = {
      ...pick(['familyId', 'jobSummary'], reqParam),
      modified: now.toISOString(),
      modifiedTimestamp__familyId: `${now.getTime()}__${data.familyId}`
    };

    if (currentUser.type === 'parent') {
      jobData = {
        ...jobData,
        status: 'CREATED_BY_PARENT',
        childUserId: data.childUserId,
        childUserId__modifiedTimestamp: `${data.childUserId}__${now.getTime()}`
      };
    } else if (currentUser.type === 'child') {
      jobData = {
        ...jobData,
        status: 'CREATED_BY_CHILD',
        childUserId: currentUser.userId,
        childUserId__modifiedTimestamp: `${data.childUserId}__${now.getTime()}`
      };
    }
  }
}
