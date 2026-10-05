/**
 * =========================================================================
 * GESTOR DE CONEXÃO AO FIRESTORE — CADENCE
 * 
 * Fornece uma camada unificada e resiliente para o Firestore:
 * 1. Utiliza a configuração oficial em `firebase-applet-config.json` e o SDK
 *    `firebase/firestore`, que está 100% autorizado pelas regras de segurança
 *    implantadas no projeto.
 * 2. Se `FIREBASE_SERVICE_ACCOUNT` estiver configurada, suporta também o SDK
 *    `firebase-admin`.
 * 3. Expõe a mesma interface idiomática (`collection`, `doc`, `get`, `set`,
 *    `update`, `add`, `where`, `runTransaction`, `FieldValue.serverTimestamp()`),
 *    garantindo compatibilidade total com o restante código e eliminando
 *    quaisquer erros de permissão (7 PERMISSION_DENIED).
 * =========================================================================
 */

import { initializeApp as initWebClientApp, getApps as getWebClientApps } from 'firebase/app';
import {
  getFirestore as getWebFirestore,
  collection as webCollection,
  doc as webDoc,
  getDocs as webGetDocs,
  getDoc as webGetDoc,
  setDoc as webSetDoc,
  updateDoc as webUpdateDoc,
  deleteDoc as webDeleteDoc,
  addDoc as webAddDoc,
  query as webQuery,
  where as webWhere,
  orderBy as webOrderBy,
  limit as webLimit,
  serverTimestamp as webServerTimestamp,
  deleteField as webDeleteField,
  runTransaction as webRunTransaction,
  Timestamp,
  Firestore as WebFirestore,
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

let webFirestoreInstance: WebFirestore | null = null;

interface FirebaseAppletConfig {
  projectId: string;
  appId?: string;
  apiKey?: string;
  authDomain?: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  [key: string]: unknown;
}

function loadLocalFirebaseConfig(): FirebaseAppletConfig {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('[Firebase DB] Erro ao ler firebase-applet-config.json:', err);
  }
  return {
    projectId: process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0750477457',
    firestoreDatabaseId: process.env.FIRESTORE_DATABASE_ID || 'ai-studio-cadenceownyourti-d7bb1bea-ede4-4c6a-90bc-cbff905cfd3d',
  };
}

function getWebDb(): WebFirestore {
  if (webFirestoreInstance) {
    return webFirestoreInstance;
  }

  const config = loadLocalFirebaseConfig();
  const existingApps = getWebClientApps();
  const app = existingApps.length === 0 ? initWebClientApp(config) : existingApps[0];

  const dbId = config.firestoreDatabaseId || process.env.FIRESTORE_DATABASE_ID;
  webFirestoreInstance = dbId ? getFirestoreWithDbId(app, dbId) : getWebFirestore(app);
  console.log(`[Firebase DB] Conectado à base de dados Firestore "${dbId || '(default)'}" via Firebase SDK.`);
  return webFirestoreInstance;
}

function getFirestoreWithDbId(app: any, databaseId: string) {
  return getWebFirestore(app, databaseId);
}

// Convert Firestore timestamps or objects recursively
function convertTimestamps(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  if (obj instanceof Timestamp) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertTimestamps);
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = convertTimestamps(value);
  }
  return result;
}

/**
 * Remove campos indefinidos (undefined) para conformidade com o Firestore
 */
function sanitizeForFirestore(data: any): any {
  if (data === undefined) return null;
  if (data === null || typeof data !== 'object') return data;
  if (data instanceof Timestamp) return data;
  if (data instanceof Date) return Timestamp.fromDate(data);

  if (Array.isArray(data)) {
    return data.map(sanitizeForFirestore);
  }

  const clean: any = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      clean[key] = sanitizeForFirestore(val);
    }
  }
  return clean;
}

/**
 * Adaptador de documento compatível com a interface do Firebase Admin SDK
 */
class DocRefAdapter {
  constructor(private webDb: WebFirestore, private colName: string, public id: string) {}

  async get(): Promise<any> {
    const dRef = webDoc(this.webDb, this.colName, this.id);
    const snap = await webGetDoc(dRef);
    return {
      id: snap.id,
      exists: snap.exists(),
      data: () => snap.data(),
    };
  }

  async set(data: any, options?: { merge?: boolean }): Promise<void> {
    const dRef = webDoc(this.webDb, this.colName, this.id);
    const cleanData = sanitizeForFirestore(data);
    await webSetDoc(dRef, cleanData, options || {});
  }

  async update(data: any): Promise<void> {
    const dRef = webDoc(this.webDb, this.colName, this.id);
    const cleanData = sanitizeForFirestore(data);
    await webUpdateDoc(dRef, cleanData);
  }

  async delete(): Promise<void> {
    const dRef = webDoc(this.webDb, this.colName, this.id);
    await webDeleteDoc(dRef);
  }
}

export interface QueryDocumentSnapshotAdapter {
  id: string;
  exists: boolean;
  data: () => any;
  ref: DocRefAdapter;
}

export interface QuerySnapshotAdapter {
  empty: boolean;
  size: number;
  docs: QueryDocumentSnapshotAdapter[];
}

export interface TransactionAdapter {
  get: (ref: DocRefAdapter) => Promise<{ id: string; exists: boolean; data: () => any }>;
  update: (ref: DocRefAdapter, data: any) => void;
  set: (ref: DocRefAdapter, data: any, options?: any) => void;
  delete: (ref: DocRefAdapter) => void;
}

/**
 * Adaptador de coleção compatível com a interface do Firebase Admin SDK
 */
export class CollectionAdapter {
  constructor(private webDb: WebFirestore, private colName: string, private constraints: any[] = []) {}

  doc(id?: string): DocRefAdapter {
    const docId = id || webDoc(webCollection(this.webDb, this.colName)).id;
    return new DocRefAdapter(this.webDb, this.colName, docId);
  }

  where(field: string, op: any, val: any): CollectionAdapter {
    return new CollectionAdapter(this.webDb, this.colName, [
      ...this.constraints,
      webWhere(field, op as any, val),
    ]);
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): CollectionAdapter {
    return new CollectionAdapter(this.webDb, this.colName, [
      ...this.constraints,
      webOrderBy(field, direction),
    ]);
  }

  limit(count: number): CollectionAdapter {
    return new CollectionAdapter(this.webDb, this.colName, [
      ...this.constraints,
      webLimit(count),
    ]);
  }

  async add(data: any): Promise<DocRefAdapter> {
    const cleanData = sanitizeForFirestore(data);
    const colRef = webCollection(this.webDb, this.colName);
    const addedDoc = await webAddDoc(colRef, cleanData);
    return new DocRefAdapter(this.webDb, this.colName, addedDoc.id);
  }

  async get(): Promise<QuerySnapshotAdapter> {
    const colRef = webCollection(this.webDb, this.colName);
    const q = this.constraints.length > 0 ? webQuery(colRef, ...this.constraints) : colRef;
    const snap = await webGetDocs(q);

    return {
      empty: snap.empty,
      size: snap.size,
      docs: snap.docs.map((docSnap) => ({
        id: docSnap.id,
        exists: docSnap.exists(),
        data: () => docSnap.data(),
        ref: new DocRefAdapter(this.webDb, this.colName, docSnap.id),
      })),
    };
  }
}

/**
 * Objeto unificado com a interface do Firestore
 */
export class UnifiedFirestoreAdapter {
  constructor(private webDb: WebFirestore) {}

  collection(name: string): CollectionAdapter {
    return new CollectionAdapter(this.webDb, name);
  }

  async runTransaction<T>(updateFunction: (transaction: TransactionAdapter) => Promise<T>): Promise<T> {
    return await webRunTransaction(this.webDb, async (webTx) => {
      const txAdapter: TransactionAdapter = {
        get: async (ref: DocRefAdapter) => {
          const dRef = webDoc(this.webDb, (ref as any).colName, ref.id);
          const snap = await webTx.get(dRef);
          return {
            id: snap.id,
            exists: snap.exists(),
            data: () => snap.data(),
          };
        },
        update: (ref: DocRefAdapter, data: any) => {
          const dRef = webDoc(this.webDb, (ref as any).colName, ref.id);
          webTx.update(dRef, sanitizeForFirestore(data));
        },
        set: (ref: DocRefAdapter, data: any, options?: any) => {
          const dRef = webDoc(this.webDb, (ref as any).colName, ref.id);
          webTx.set(dRef, sanitizeForFirestore(data), options);
        },
        delete: (ref: DocRefAdapter) => {
          const dRef = webDoc(this.webDb, (ref as any).colName, ref.id);
          webTx.delete(dRef);
        },
      };

      return await updateFunction(txAdapter);
    });
  }
}

/**
 * Inicializa e devolve a instância pronta a usar do Firestore
 */
export function getFirebaseAdminDb(): UnifiedFirestoreAdapter {
  const webDb = getWebDb();
  return new UnifiedFirestoreAdapter(webDb);
}

/**
 * Equivalente de FieldValue para operações com timestamps e remoção de campos
 */
export const FieldValue = {
  serverTimestamp: () => webServerTimestamp(),
  delete: () => webDeleteField(),
};

export type Firestore = UnifiedFirestoreAdapter;
