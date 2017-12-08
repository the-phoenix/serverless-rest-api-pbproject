import { SNS } from 'aws-sdk';
import { checkValidNotiTriggerMessage } from 'utils/validation';

const sns = new SNS({
  region: 'us-east-1'
});

export function trigger (message) { // eslint-disable-line
  if (!checkValidNotiTriggerMessage(message)) {
    throw new Error('Invalid notification trigger message passed to trigger');
  }

  const params = {
    Message: JSON.stringify({
      default: JSON.stringify(message),
      lambda: JSON.stringify(message),
      email: JSON.stringify(message)
    }),
    MessageStructure: 'json',
    TargetArn: process.env.SNS_NOTI_TRIGGER_ARN
  };

  return sns.publish(params).promise();
}

export const notifyJob = (job) => {
  let performedAction;

  switch (job.status) {
    default: case 'CREATED_BY_PARENT':
      performedAction = 'kid.jobCreated.parent';
      break;
    case 'CREATED_BY_CHILD':
      performedAction = 'parent.jobCreated.kid';
      break;
    case 'START_APPROVED':
      performedAction = 'kid.jobStartApproved.parent';
      break;
    case 'START_DECLINED':
      performedAction = 'kid.jobStartDeclined.parent';
      break;
    case 'STARTED':
      performedAction = 'parent.jobStarted.kid';
      break;
    case 'FINISHED':
      performedAction = 'parent.jobFinished.kid';
      break;
    case 'FINISH_DECLINED':
      performedAction = 'parent.jobFinishDeclined.kid';
      break;
    case 'PAID':
      performedAction = 'kid.jobPaid.kid';
      break;
  }

  return trigger({
    content: performedAction,
    jobId: job.id
  });
};

export const notifyWithdrawal = (withdrawal) => {
  let performedAction;

  if (withdrawal.status === 'CREATED_BY_CHILD') {
    performedAction = 'parent.withdrawal.CREATED_BY_CHILD';
  } else if (withdrawal.status === 'APPROVED') {
    const earlierHistory = withdrawal.history[0];
    performedAction = earlierHistory.status === 'CREATED_BY_PARENT'
      ? 'child.withdrawal.CREATED_BY_PARENT'
      : 'child.withdrawal.APPROVED';
  }
  // todo: notify when withdrawal request is rejected

  return trigger({
    content: performedAction,
    withdrawalId: withdrawal.id
  });
};
