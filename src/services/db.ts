import { openDB, type DBSchema } from 'idb';
import { type VisualBible, type SceneNode, type Conversation } from '../types';

interface MonstrosityDB extends DBSchema {
  projects: {
    key: string;
    value: {
      id: string;
      name: string;
      visualBible: VisualBible;
      scenes: SceneNode[]; // Scenes now store asset IDs, not base64
      conversations: Conversation[];
      lastUpdated: number;
    };
  };
  assets: {
    key: string;
    value: {
      id: string;
      data: Blob; // Store as Blob for efficiency
      type: 'image' | 'video';
      mimeType: string;
      createdAt: number;
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

export const saveAsset = async (id: string, data: Blob | string, type: 'image' | 'video', mimeType: string = 'image/png') => {
  const db = await initDB();
  
  // Convert base64 string to Blob if necessary
  let blobData: Blob;
  if (typeof data === 'string') {
    const byteString = atob(data.split(',')[1] || data);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    blobData = new Blob([ab], { type: mimeType });
  } else {
    blobData = data;
  }

  return db.put('assets', { 
    id, 
    data: blobData, 
    type, 
    mimeType,
    createdAt: Date.now() 
  });
};

export const getAsset = async (id: string) => {
  const db = await initDB();
  return db.get('assets', id);
};
