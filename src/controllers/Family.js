import { isEmpty } from 'ramda';
import FamilyModel from 'models/Family';
import UserModel from 'models/User';

export default class FamilyController {
  constructor() {
    this.family = new FamilyModel();
    this.user = new UserModel();
  }

  get(id) {
    return this.family
      .fetchById(id)
      .then((data) => {
        if (isEmpty(data.Items)) {
          return Promise.reject(new Error('No family with provided id'));
        }

        return data.Items;
      });
  }

  join(targetMemberToken) {
    if (isEmpty(targetMemberToken)) {
      return Promise.reject(new Error('targetMemberToken is missing from parameter'));
    }

    return this.user
      .getByAccessToken(targetMemberToken)
      .then(data => {
        const targetMember = {
          'username': data.Username,
          data.UserAttributes
        }
        console.log('hey world', data)
      });
  }
}
