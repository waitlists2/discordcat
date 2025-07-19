// This file is kept minimal since we're using Elasticsearch directly
// and don't need traditional database storage for this application

export interface IStorage {
  // Placeholder interface - all data operations go through Elasticsearch
}

export class MemStorage implements IStorage {
  constructor() {
    // No storage needed for this application
  }
}

export const storage = new MemStorage();
