export const prisma = {
  get user() {
    const { TestDatabase } = require('../helpers/database');
    return TestDatabase.getPrisma().user;
  },
  get project() {
    const { TestDatabase } = require('../helpers/database');
    return TestDatabase.getPrisma().project;
  },
  get schedule() {
    const { TestDatabase } = require('../helpers/database');
    return TestDatabase.getPrisma().schedule;
  },
  get $connect() {
    const { TestDatabase } = require('../helpers/database');
    return TestDatabase.getPrisma().$connect;
  },
  get $disconnect() {
    const { TestDatabase } = require('../helpers/database');
    return TestDatabase.getPrisma().$disconnect;
  },
  get $queryRaw() {
    const { TestDatabase } = require('../helpers/database');
    return TestDatabase.getPrisma().$queryRaw;
  },
  get $transaction() {
    const { TestDatabase } = require('../helpers/database');
    return TestDatabase.getPrisma().$transaction;
  }
};

export const testConnection = jest.fn().mockResolvedValue(true);
export const seedDatabase = jest.fn().mockResolvedValue(undefined);

export default { prisma, testConnection, seedDatabase };