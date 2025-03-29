// global.d.ts
import { MongoClient } from 'mongodb';

declare global {
  // Declaring the global interface to have _mongoClientPromise of type Promise<MongoClient>
  var _mongoClientPromise: Promise<MongoClient>;
}