import { success } from 'utils/response';
import { version } from '../../package.json';

export function health(event, context, callback) {
  const healthData = {
    health: 'good',
    version
  };
  const response = success(JSON.stringify(healthData));

  callback(null, response);
}

export default { health }; // Add this for test
