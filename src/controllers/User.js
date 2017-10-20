import UserModel from 'models/User';
import { checkIfReserved, checkIfProfane } from 'utils/validation';

export default class User {
  constructor() {
    this.user = new UserModel();
  }

  validateUserNameOffline(userName) { // eslint-disable-line
    const validExp = /^[a-zA-Z]+[\w\d\.\-_]*$/; // eslint-disable-line

    if (!validExp.test(userName)) {
      return 'username can only have a-z dot(.) underscore(_) and dash(-)';
    } else if (userName.length < 3 || userName.length > 16) {
      return 'username must have length between 3 ~ 16 chars';
    } else if (checkIfReserved(userName)) {
      return 'given username is reserved one';
    } else if (checkIfProfane(userName)) {
      return 'given username is not civilized one';
    }

    return false;
  }

  async checkHasParentWithGivenEmail(email) {
    return this.user
      .fetchByAttribute('email', email)
      .then((Users) => {
        if (!Users.length) {
          return false;
        }

        return Users.find(user =>
          user.Attributes.filter(attrib =>
            (attrib.Name === 'custom:type' && attrib.Value === 'parent') ||
            (attrib.Name === 'email' && attrib.Value === email)).length === 2);
      });
  }

  async checkUsedPreferredName(preferredUsername) {
    return this.user
      .fetchByAttribute('preferred_username', preferredUsername)
      .then(Users => !!Users.length);
  }

  async addUserToGroup(...args) {
    return this.user
      .addUserToGroup(...args);
  }
}
