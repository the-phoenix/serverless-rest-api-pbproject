import { success, failure } from 'utils/response';
import dbClient from 'utils/db-client';
import Todo from 'controllers/Family';

const todo = new Todo(dbClient);

export async function getall(event, context, callback) {
  // const response = {
  //   message: 'Go Serverless v1.0! Your function executed successfully!',
  //   input: event
  // };

  try {
    const data = await todo.fetchAll();

    callback(null, success(data));
  } catch (e) {
    callback(null, failure({ status: 'failure', message: e.toString() }));
  }
}

export default { getall }; // Add this for test
