import { success, failure } from 'utils/response';
import parseEvent from 'utils/parser';
import FamilyController from 'controllers/Family';

const family = new FamilyController();

export async function getMe(event, context, callback) {
  let response;
  console.log('Get event obj', JSON.stringify(event));

  try {
    const { currentUser } = parseEvent(event);

    const familyInfo = await family.fetchByUserId(currentUser.userId);
    currentUser.family = familyInfo;

    response = success(JSON.stringify(currentUser));
  } catch (e) {
    console.log('Error from getMe', e);
    response = failure(e);
  }

  callback(null, response);
}

export default { getMe };
