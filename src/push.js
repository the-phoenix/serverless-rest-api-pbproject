const AWS = require('aws-sdk');
const sns = new AWS.SNS({
  region: 'us-east-1'
});

sns.createPlatformEndpoint({
  PlatformApplicationArn: 'arn:aws:sns:us-east-1:501132611696:app/APNS_SANDBOX/PennyboxApp-Dev',
  Token: 'f85178d41c6747e9d1c0e0c603870d13a03b0890f7ab9d7c33aa81d302476c59'
}, function(err, data) {
  if (err) {
    console.log(err.stack);
    return;
  }

  var endpointArn = data.EndpointArn;

  var payload = {
    default: 'Hello World',
    APNS: {
      aps: {
        alert: 'Hello World',
        sound: 'default',
        badge: 1
      }
    }
  };

  // first have to stringify the inner APNS object...
  payload.APNS = JSON.stringify(payload.APNS);
  // then have to stringify the entire message payload
  payload = JSON.stringify(payload);

  console.log('sending push');
  sns.publish({
    Message: payload,
    MessageStructure: 'json',
    TargetArn: endpointArn
  }, function(err, data) {
    if (err) {
      console.log(err.stack);
      return;
    }

    console.log('push sent');
    console.log(data);
  });
});
