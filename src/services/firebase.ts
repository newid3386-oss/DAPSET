import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { checkPayloadCapacity } from '../utils/imageCompressor';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Export Firestore with specific database ID (CRITICAL: Required for named firestore database)
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

// Export Auth
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test live connection to Firestore
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network is disconnected.');
      return false;
    }
    return true;
  }
}

// Sanitize school ID for Firestore document key
export function getSafeSchoolId(schoolName: string): string {
  const clean = schoolName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 64);
  return clean || 'sdn_default_school';
}

export interface CloudBackupItem {
  id: string;
  schoolId: string;
  schoolName: string;
  createdAt: string;
  createdBy: string;
  version: string;
  notes?: string;
  dataJson: string;
}

export interface SyncMetaSignal {
  schoolId: string;
  lastModule: string;
  lastAction?: string;
  updatedAt: string;
  updatedBy?: string;
  deviceId: string;
  version?: string;
}

// Save live snapshot to Firestore with byte size verification
export async function saveLiveSnapshot(
  schoolId: string,
  schoolName: string,
  dataJson: string,
  updatedBy: string = 'Petugas Inventaris'
): Promise<void> {
  const path = `school_snapshots/${schoolId}`;
  const capacity = checkPayloadCapacity(dataJson);
  if (!capacity.isSafe) {
    console.warn(`Firestore snapshot size warning: ${capacity.formattedSize} (${capacity.percentage}%)`);
  }

  try {
    const docRef = doc(db, 'school_snapshots', schoolId);
    await setDoc(docRef, {
      schoolId,
      schoolName: schoolName.slice(0, 256),
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy.slice(0, 256),
      version: '3.0.0-PRO',
      dataJson,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Load live snapshot from Firestore
export async function loadLiveSnapshot(schoolId: string): Promise<string | null> {
  const path = `school_snapshots/${schoolId}`;
  try {
    const docRef = doc(db, 'school_snapshots', schoolId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return data?.dataJson || null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

// Create an immutable backup record in Firestore
export async function createCloudBackup(
  schoolId: string,
  schoolName: string,
  dataJson: string,
  createdBy: string = 'Petugas Inventaris',
  notes: string = 'Pencadangan rutin cloud'
): Promise<string> {
  const backupId = `bkp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `school_backups/${backupId}`;
  try {
    const docRef = doc(db, 'school_backups', backupId);
    await setDoc(docRef, {
      schoolId,
      schoolName: schoolName.slice(0, 256),
      createdAt: new Date().toISOString(),
      createdBy: createdBy.slice(0, 256),
      version: '3.0.0-PRO',
      notes: notes.slice(0, 500),
      dataJson,
    });
    return backupId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Fetch list of cloud backups for a school
export async function fetchCloudBackups(schoolId: string): Promise<CloudBackupItem[]> {
  const path = 'school_backups';
  try {
    const colRef = collection(db, 'school_backups');
    const q = query(colRef, where('schoolId', '==', schoolId));
    const snapshot = await getDocs(q);
    const list: CloudBackupItem[] = [];
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      list.push({
        id: docSnap.id,
        schoolId: d.schoolId,
        schoolName: d.schoolName || '',
        createdAt: d.createdAt,
        createdBy: d.createdBy || 'Petugas',
        version: d.version || '3.0.0',
        notes: d.notes || '',
        dataJson: d.dataJson,
      });
    });
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

// Delete a backup from Firestore
export async function deleteCloudBackup(backupId: string): Promise<void> {
  const path = `school_backups/${backupId}`;
  try {
    await deleteDoc(doc(db, 'school_backups', backupId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// =========================================================================
// PRIORITAS 3: GRANULAR SUBCOLLECTION & MULTI-DEVICE COLLABORATION METHODS
// =========================================================================

export type GranularModuleName =
  | 'items'
  | 'barang_masuk'
  | 'barang_keluar'
  | 'assets'
  | 'pengambilan_atk'
  | 'mutasi'
  | 'stock_opname'
  | 'pemeliharaan'
  | 'penghapusan'
  | 'rkbs'
  | 'suppliers'
  | 'users'
  | 'config';

/**
 * Simpan satu modul granular tertentu ke Firestore & siarkan sinyal update
 * Mencegah benturan data antar laptop (device A input keluar, device B input masuk)
 */
export async function saveModuleToCloud(
  schoolId: string,
  moduleName: GranularModuleName,
  moduleData: any,
  updatedBy: string,
  deviceId: string,
  actionDesc?: string
): Promise<void> {
  const docId = `${schoolId}_${moduleName}`;
  const path = `school_modules/${docId}`;
  const dataJson = JSON.stringify(moduleData);

  try {
    const modRef = doc(db, 'school_modules', docId);
    await setDoc(modRef, {
      schoolId,
      moduleName,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy.slice(0, 256),
      version: '3.0.0-PRO',
      itemCount: Array.isArray(moduleData) ? moduleData.length : 1,
      dataJson,
    });

    // Broadcast sync signal ke semua perangkat terhubung
    const metaRef = doc(db, 'school_sync_meta', schoolId);
    await setDoc(metaRef, {
      schoolId,
      lastModule: moduleName,
      lastAction: (actionDesc || `Pembaruan data ${moduleName}`).slice(0, 250),
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy.slice(0, 256),
      deviceId: deviceId.slice(0, 64),
      version: '3.0.0-PRO',
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Muat data satu modul granular dari Firestore
 */
export async function loadModuleFromCloud<T = any>(
  schoolId: string,
  moduleName: GranularModuleName
): Promise<T | null> {
  const docId = `${schoolId}_${moduleName}`;
  const path = `school_modules/${docId}`;
  try {
    const modRef = doc(db, 'school_modules', docId);
    const snap = await getDoc(modRef);
    if (!snap.exists()) return null;
    const d = snap.data();
    if (!d?.dataJson) return null;
    return JSON.parse(d.dataJson) as T;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

/**
 * Pasang listener real-time multi-perangkat via Firestore onSnapshot
 * Mengabari saat perangkat lain melakukan perubahan modul apapun
 */
export function subscribeToSyncMeta(
  schoolId: string,
  onSignalReceived: (signal: SyncMetaSignal) => void
): () => void {
  const metaRef = doc(db, 'school_sync_meta', schoolId);
  return onSnapshot(
    metaRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as SyncMetaSignal;
        onSignalReceived(data);
      }
    },
    (err) => {
      console.warn('Real-time sync meta subscription error (offline):', err.message);
    }
  );
}

/**
 * Simpan seluruh modul secara granular satu per satu (Initial seed / full sync)
 */
export async function saveAllModulesGranular(
  schoolId: string,
  databaseState: {
    config: any;
    users: any[];
    suppliers: any[];
    items: any[];
    barangMasuk: any[];
    barangKeluar: any[];
    assets: any[];
    mutasi: any[];
    stockOpname: any[];
    pemeliharaan: any[];
    penghapusan: any[];
    pengambilanATK: any[];
    rkbs: any[];
  },
  updatedBy: string,
  deviceId: string
): Promise<void> {
  const modulesToSave: [GranularModuleName, any][] = [
    ['config', databaseState.config],
    ['users', databaseState.users],
    ['suppliers', databaseState.suppliers],
    ['items', databaseState.items],
    ['barang_masuk', databaseState.barangMasuk],
    ['barang_keluar', databaseState.barangKeluar],
    ['assets', databaseState.assets],
    ['mutasi', databaseState.mutasi],
    ['stock_opname', databaseState.stockOpname],
    ['pemeliharaan', databaseState.pemeliharaan],
    ['penghapusan', databaseState.penghapusan],
    ['pengambilan_atk', databaseState.pengambilanATK],
    ['rkbs', databaseState.rkbs],
  ];

  for (const [modName, data] of modulesToSave) {
    await saveModuleToCloud(schoolId, modName, data, updatedBy, deviceId, `Inisialisasi modul ${modName}`);
  }
}

// =========================================================================
// IMMUTABLE CLOUD AUDIT TRAIL METHODS (P0 Hardened Ledger)
// =========================================================================

export interface CloudAuditLogItem {
  id: string;
  schoolId: string;
  timestamp: string;
  aksi: string;
  modul: string;
  recordId: string;
  userEmail?: string;
  userName?: string;
  dataJson?: string;
}

export async function recordCloudAuditLog(
  schoolId: string,
  log: {
    id: string;
    timestamp: string;
    aksi: string;
    modul: string;
    recordId: string;
    userEmail?: string;
    userName?: string;
    dataJson?: string;
  }
): Promise<void> {
  const safeLogId = log.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  try {
    const logRef = doc(db, 'school_audit_logs', safeLogId);
    await setDoc(logRef, {
      schoolId,
      id: safeLogId,
      timestamp: log.timestamp,
      aksi: log.aksi,
      modul: log.modul,
      recordId: log.recordId,
      userEmail: log.userEmail?.slice(0, 256) || '',
      userName: log.userName?.slice(0, 256) || '',
      dataJson: (log.dataJson || '').slice(0, 1000000),
    });
  } catch (err) {
    console.warn('Could not record immutable cloud audit log (offline fallback):', err);
  }
}

export async function fetchCloudAuditLogs(schoolId: string): Promise<CloudAuditLogItem[]> {
  try {
    const q = query(collection(db, 'school_audit_logs'), where('schoolId', '==', schoolId));
    const snapshot = await getDocs(q);
    const list: CloudAuditLogItem[] = [];
    snapshot.forEach((d) => {
      list.push(d.data() as CloudAuditLogItem);
    });
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return list;
  } catch (err) {
    console.warn('Could not fetch cloud audit logs:', err);
    return [];
  }
}
