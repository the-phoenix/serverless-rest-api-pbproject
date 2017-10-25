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

  async fetchByUserId(id) {
    const familyUserData = await this.family.fetchByMember(id);
    const promises$ = familyUserData.Items.map(family => this.get(family.id));

    return Promise.all(promises$);
  }

  async join(targetMemberToken, myToken) {
    if (isEmpty(targetMemberToken)) {
      return Promise.reject(new Error('targetMemberToken is missing from parameter'));
    }

    const targetData = await this.user.getByAccessToken(targetMemberToken);
    const me = await this.user.getByAccessToken(myToken);

    if (targetData['custom:type'] !== 'parent') {
      return Promise.reject(new Error('targetMember should be parent'));
    }

    let targetFamily;
    const targetFamilies = await this.family.fetchMembersById(targetData.userId);
    if (!targetFamilies.length) {
      targetFamily = await this.family.createFamily(targetData);
      await this.family.joinFamily(targetFamily.id, [targetData, me]);
    } else {
      [targetFamily] = targetFamilies;
      await this.family.joinFamily(targetFamily.id, [me]);
    }

    return targetData;
  }
}
