import Boom from 'boom';
import { map, omit, isEmpty } from 'ramda';
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
      members: map(omit('id'), respData[1])
    };
  }

  async fetchByUserId(userId) {
    const familyUserData = await this.family.fetchByMember(userId);
    const promises$ = familyUserData.Items.map(family => this.get(family.id));

    return Promise.all(promises$);
  }

  async create(familyAdmin) {
    const familyUserData = await this.family.fetchByMember(familyAdmin.userId);
    if (familyUserData.Count > 2) {
      return Promise.reject(Boom.badRequest('maximum available families are 2'));
    }

    const newFamily = await this.family.create(familyAdmin);

    await this.family.join(newFamily.id, familyAdmin);

    return newFamily;
  }

  async join(user, targetFamilyId) {
    const family = await this.family.fetchById(targetFamilyId);
    if (isEmpty(family.Item)) {
      return Promise.reject(Boom.notFound('not existing family'));
    }

    const familyUserData = await this.family.fetchByMember(user.userId);

    if (familyUserData.Count > 2) {
      return Promise.reject(Boom.badRequest('can\'t join more than 2 families'));
    } else if (familyUserData.Items.find(item => item.id === targetFamilyId)) {
      return Promise.reject(Boom.badRequest('already member of target family'));
    }

    const promises$ = [
      this.family.join(targetFamilyId, user)
    ];

    // copy family admin email to child's email
    if (user.type === 'child'/* && !user.email */) {
      promises$.push(this.user.updateAttribute(user, [
        {
          Name: 'email',
          Value: family.Item.adminSummary.email
        },
        {
          Name: 'email_verified',
          Value: 'true'
        }
      ]));
    }

    return Promise.all(promises$);
  }
}
