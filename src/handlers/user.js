import { success } from 'utils/response';

export function get(event, context, callback) {
  return callback(null, success('Deprecated for now, please send request to cognito directly'));
}

export default { get }; // Add this for test
