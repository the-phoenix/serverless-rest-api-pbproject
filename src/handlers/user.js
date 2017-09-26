import { success, failure } from 'utils/response';
import parseEvent from 'utils/parser';
import dbClient from 'utils/db-client';
import User from 'controllers/User';

const user = new User(dbClient);

export async function get(event, context, callback) {
  try {
    const { params } = parseEvent(event);
    const data = await user.fetchOne(params.id);

    callback(null, success(data));
  } catch (e) {
    callback(null, failure({ status: 'failure', message: e.toString() }));
  }
}

export default { get }; // Add this for test
