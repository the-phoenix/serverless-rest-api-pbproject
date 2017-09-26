export default class Todo {
  constructor(dbClient) {
    this.dbClient = dbClient;
  }

  fetchById(id) {
    const params = {
      TableName: 'families',
      Key: { id }
    };

    return this.dbClient('get', params);
  }
}
