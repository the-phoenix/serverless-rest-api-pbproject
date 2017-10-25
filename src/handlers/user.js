import { success, failure } from 'utils/response';
import parseEvent from 'utils/parser';
import FamilyController from 'controllers/Family';

const family = new FamilyController();

export async function getMe(event, context, callback) {
  let response;
  try {
    const { currentUser, queryParams } = parseEvent(event);
    console.log('query params', queryParams);
    if (queryParams.scope === 'full') {
      const familyInfo = await family.fetchByUserId(currentUser.userId);
      console.log('family', familyInfo);
      currentUser.family = familyInfo;
    }

    response = success(JSON.stringify(currentUser));
  } catch (e) {
    console.log('Error from getMe', e);
    response = failure(e);
  }

  callback(null, response);
}

export default { getMe };
