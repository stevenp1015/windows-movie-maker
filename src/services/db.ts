import { openDB, type DBSchema } from 'idb';
import { type VisualBible, type SceneNode, type Conversation } from '../types';

interface MonstrosityDB extends DBSchema {
  projects: {
    key: string;
    value: {
      id: string;
      name: string;
      visualBible: VisualBible;
      scenes: SceneNode[];
      conversations: Conversation[];
      lastUpdated: number;
    };
  };
  assets: {
    key: string;
    value: {
      id: string;
      data: Blob | string; // Base64 or Blob
      type: 'image' | 'video';
    };
  };
}

const DB_NAME = 'monstrosity-db';
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB<MonstrosityDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('assets')) {
        db.createObjectStore('assets', { keyPath: 'id' });
      }
    },
  });
};

export const saveProject = async (project: MonstrosityDB['projects']['value']) => {
  const db = await initDB();
  return db.put('projects', project);
};

export const getProject = async (id: string) => {
  const db = await initDB();
  return db.get('projects', id);
};

export const getAllProjects = async () => {
  const db = await initDB();
  return db.getAll('projects');
};

export const saveAsset = async (id: string, data: Blob | string, type: 'image' | 'video') => {
  const db = await initDB();
  return db.put('assets', { id, data, type });
};

export const getAsset = async (id: string) => {
  const db = await initDB();
  return db.get('assets', id);
};
