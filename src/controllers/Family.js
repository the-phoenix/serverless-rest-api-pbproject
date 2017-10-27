import { map, omit } from 'ramda';
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

  async fetchByUserId(userId) {
    const familyUserData = await this.family.fetchByMember(userId);
    const promises$ = familyUserData.Items.map(family => this.get(family.id));

    return Promise.all(promises$);
  }

  async create(familyAdmin) {
    const familyUserData = await this.family.fetchByMember(familyAdmin.userId);
    if (familyUserData.length > 2) {
      return Promise.reject(new Error('maximum available families are 2'));
    }

    const newFamily = await this.family.create(familyAdmin);
    await this.family.join(newFamily.id, familyAdmin);

    return newFamily;
  }

  async join(user, targetFamilyId) {
    const familyUserData = await this.family.fetchByMember(user.userId);

    if (familyUserData.length > 2) {
      return Promise.reject(new Error('maximum available families are 2'));
    }

    return this.family.join(targetFamilyId, user);
  }
}
