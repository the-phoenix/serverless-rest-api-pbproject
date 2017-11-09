import Boom from 'boom';
import { pick } from 'ramda';
import JobModel from 'models/Job';
import { isOffline } from 'utils/db-client';
import FamilyModel from 'models/Family';
import {
  checkAllowedJobStatusSafeUpdate as checkSafeStatus
} from 'utils/validation';

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
      throw Boom.badRequest('Disallowed to see other family\'s data');
    }

    return this.job.fetchByFamilyId(familyId, lastEvaluatedKey, limit);
  }

  async listByFamilyMember(userId, familyId, lastEvaluatedKey, limit) {
    // check if user is family member
    if (!(isOffline() || await this.family.checkIsFamilyMember(familyId, userId))) {
      throw Boom.badRequest('Disallowed to see other family\'s data');
    }

    return this.job.fetchByFamilyMember(familyId, userId, lastEvaluatedKey, limit);
  }

  async create(currentUser, reqParam) {
    // check if user is family member
    if (!(isOffline() ||
      await this.family.checkIsFamilyMember(reqParam.familyId, currentUser.userId)
    )) {
      throw Boom.badRequest('Disallowed to set other family\'s data');
    }

    let jobData = pick(['familyId', 'jobSummary', 'childUserId'], reqParam);

    if (currentUser.type === 'parent') {
      jobData = {
        ...jobData,
        status: 'CREATED_BY_PARENT'
      };
    } else if (currentUser.type === 'child') {
      jobData = {
        ...jobData,
        status: 'CREATED_BY_CHILD',
        childUserId: currentUser.userId
      };
    }

    let newJob = await this.job.create(currentUser.userId, jobData);
    if (currentUser.type === 'parent') {
      newJob = await this.job.updateStatus(currentUser.userId, {
        status: 'START_APPROVED'
      }, newJob);
    }

    return newJob;
  }

  async safeUpdateStatus(currentUser, jobId, reqParam) {
    const jobData = await this.job.fetchById(jobId);
    if (!jobData) {
      throw Boom.notFound('Not existing job');
    }

    const safetyError = checkSafeStatus(currentUser.type, jobData.status, reqParam.status);
    if (safetyError.error) {
      throw Boom.badRequest(safetyError.error.details);
    }

    const updated = await this.job.updateStatus(currentUser.userId, reqParam, jobData);
    if (updated.status === 'PAID') {
      await this.family.updateFamilyMemberAfterJobCompletion(updated);
    }

    return updated;
  }
}
