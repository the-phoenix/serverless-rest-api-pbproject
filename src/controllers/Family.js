import { isEmpty, map, omit } from 'ramda';
import FamilyModel from 'models/Family';
import UserModel from 'models/User';

export default class FamilyController {
  constructor() {
    this.family = new FamilyModel();
    this.user = new UserModel();
  }

  async get(id, scope) {
    const promises$ = [this.family.fetchById(id)];
    const isFull = scope && scope === 'full';

    isFull && promises$.push(this.family.fetchMembersById(id));
    const respData = await Promise.all(promises$);

    if (!isFull) {
      return respData[0].Item;
    }

    return {
      ...respData[0].Item,
      members: map(omit('id'), respData[1].Items)
    };
  }

  join(targetMemberToken) {
    if (isEmpty(targetMemberToken)) {
      return Promise.reject(new Error('targetMemberToken is missing from parameter'));
    }

    return this.user
      .getByAccessToken(targetMemberToken)
      .then(data => console.log('hey world', data));
  }
}
