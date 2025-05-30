const { prisma } = require("./database");
const Web3StorageClient = require("./storage");
const { default: Web3Storage } = require("./storage");

module.exports = {
  ServerConfig: require("./server-config"),
  Logger: require("./logger-config"),
  prisma,
  Web3StorageClient
};
