export default class User {
  constructor(dbClient) {
    this.dbClient = dbClient;
  }

  fetchOne(id) {
    const params = {
      TableName: 'users',
      Key: { id }
    };

    return this.dbClient('get', params);
  }
}
