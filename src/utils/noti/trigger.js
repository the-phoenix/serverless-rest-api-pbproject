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
      default: message,
      lambda: message
    }),
    MessageStructure: 'json',
    TargetArn: process.env.SNS_NOTI_TRIGGER_ARN
  };

  return sns.publish(params).promise();
}
