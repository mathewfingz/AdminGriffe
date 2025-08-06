import admin from 'firebase-admin';
import { config } from '../config/index.js';

export interface FirebaseAdminConfig {
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
  databaseURL?: string;
  storageBucket?: string;
}

export class FirebaseAdminService {
  private app: admin.app.App | null = null;
  private auth: admin.auth.Auth | null = null;
  private firestore: admin.firestore.Firestore | null = null;
  private storage: admin.storage.Storage | null = null;

  constructor() {
    this.initializeFirebaseAdmin();
  }

  private initializeFirebaseAdmin(): void {
    try {
      // Validate required Firebase configuration
      if (!config.FIREBASE_PROJECT_ID) {
        throw new Error('FIREBASE_PROJECT_ID is required for Firebase Admin initialization');
      }

      // Check if Firebase Admin is already initialized
      if (!admin.apps || admin.apps.length === 0) {
        let serviceAccount: admin.ServiceAccount | undefined;

        // Try to parse service account from environment variable
        if (config.FIREBASE_SERVICE_ACCOUNT_KEY && config.FIREBASE_SERVICE_ACCOUNT_KEY.length > 0) {
          try {
            serviceAccount = JSON.parse(config.FIREBASE_SERVICE_ACCOUNT_KEY);
          } catch (error) {
            console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY as JSON');
          }
        }

        // Initialize with service account or default credentials
        if (serviceAccount) {
          this.app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: config.FIREBASE_PROJECT_ID,
            storageBucket: config.FIREBASE_STORAGE_BUCKET,
          });
          console.log('Firebase Admin initialized with service account');
        } else {
          // Fallback to default credentials (useful in Google Cloud environments)
          this.app = admin.initializeApp({
            projectId: config.FIREBASE_PROJECT_ID,
            storageBucket: config.FIREBASE_STORAGE_BUCKET,
          });
          console.log('Firebase Admin initialized with default credentials');
        }
      } else if (admin.apps && admin.apps.length > 0) {
        this.app = admin.apps[0] as admin.app.App;
        console.log('Firebase Admin app already initialized');
      } else {
        throw new Error('No Firebase Admin apps found');
      }

      // Ensure app is initialized before accessing services
      if (!this.app) {
        throw new Error('Failed to initialize Firebase Admin app');
      }

      // Initialize Firebase Admin services
      this.auth = this.app.auth();
      this.firestore = this.app.firestore();
      this.storage = this.app.storage();

      console.log('Firebase Admin services initialized');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
      throw error;
    }
  }

  // Authentication methods
  async createUser(userData: {
    email: string;
    password?: string;
    displayName?: string;
    photoURL?: string;
    emailVerified?: boolean;
    disabled?: boolean;
  }): Promise<admin.auth.UserRecord> {
    try {
      if (!this.auth) throw new Error('Firebase Auth not initialized');
      const userRecord = await this.auth.createUser(userData);
      console.log(`User created with UID: ${userRecord.uid}`);
      return userRecord;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<admin.auth.UserRecord> {
    try {
      if (!this.auth) throw new Error('Firebase Auth not initialized');
      const userRecord = await this.auth.getUserByEmail(email);
      return userRecord;
    } catch (error) {
      console.error(`Failed to get user by email ${email}:`, error);
      throw error;
    }
  }

  async getUserByUid(uid: string): Promise<admin.auth.UserRecord> {
    try {
      if (!this.auth) throw new Error('Firebase Auth not initialized');
      const userRecord = await this.auth.getUser(uid);
      return userRecord;
    } catch (error) {
      console.error(`Failed to get user by UID ${uid}:`, error);
      throw error;
    }
  }

  async updateUser(uid: string, userData: admin.auth.UpdateRequest): Promise<admin.auth.UserRecord> {
    try {
      if (!this.auth) throw new Error('Firebase Auth not initialized');
      const userRecord = await this.auth.updateUser(uid, userData);
      console.log(`User updated: ${uid}`);
      return userRecord;
    } catch (error) {
      console.error(`Failed to update user ${uid}:`, error);
      throw error;
    }
  }

  async deleteUser(uid: string): Promise<void> {
    try {
      if (!this.auth) throw new Error('Firebase Auth not initialized');
      await this.auth.deleteUser(uid);
      console.log(`User deleted: ${uid}`);
    } catch (error) {
      console.error(`Failed to delete user ${uid}:`, error);
      throw error;
    }
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      if (!this.auth) throw new Error('Firebase Auth not initialized');
      const decodedToken = await this.auth.verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      console.error('Failed to verify ID token:', error);
      throw error;
    }
  }

  async createCustomToken(uid: string, additionalClaims?: object): Promise<string> {
    try {
      if (!this.auth) throw new Error('Firebase Auth not initialized');
      const customToken = await this.auth.createCustomToken(uid, additionalClaims);
      return customToken;
    } catch (error) {
      console.error(`Failed to create custom token for ${uid}:`, error);
      throw error;
    }
  }

  // Firestore methods
  async createDocument(collectionName: string, docId: string, data: any): Promise<void> {
    try {
      if (!this.firestore) throw new Error('Firestore not initialized');
      await this.firestore.collection(collectionName).doc(docId).set(data);
      console.log(`Document created in ${collectionName}/${docId}`);
    } catch (error) {
      console.error(`Failed to create document in ${collectionName}:`, error);
      throw error;
    }
  }

  async getDocument(collectionName: string, docId: string): Promise<admin.firestore.DocumentData | null> {
    try {
      if (!this.firestore) throw new Error('Firestore not initialized');
      const doc = await this.firestore.collection(collectionName).doc(docId).get();
      if (doc.exists) {
        return doc.data() || null;
      } else {
        console.warn(`Document not found: ${collectionName}/${docId}`);
        return null;
      }
    } catch (error) {
      console.error(`Failed to get document from ${collectionName}:`, error);
      throw error;
    }
  }

  async updateDocument(collectionName: string, docId: string, data: any): Promise<void> {
    try {
      if (!this.firestore) throw new Error('Firestore not initialized');
      await this.firestore.collection(collectionName).doc(docId).update(data);
      console.log(`Document updated in ${collectionName}/${docId}`);
    } catch (error) {
      console.error(`Failed to update document in ${collectionName}:`, error);
      throw error;
    }
  }

  async deleteDocument(collectionName: string, docId: string): Promise<void> {
    try {
      if (!this.firestore) throw new Error('Firestore not initialized');
      await this.firestore.collection(collectionName).doc(docId).delete();
      console.log(`Document deleted from ${collectionName}/${docId}`);
    } catch (error) {
      console.error(`Failed to delete document from ${collectionName}:`, error);
      throw error;
    }
  }

  async queryDocuments(
    collectionName: string,
    field: string,
    operator: admin.firestore.WhereFilterOp,
    value: any
  ): Promise<admin.firestore.QuerySnapshot> {
    try {
      if (!this.firestore) throw new Error('Firestore not initialized');
      const querySnapshot = await this.firestore
        .collection(collectionName)
        .where(field, operator, value)
        .get();
      console.log(`Query executed on ${collectionName}: ${querySnapshot.size} documents found`);
      return querySnapshot;
    } catch (error) {
      console.error(`Failed to query documents from ${collectionName}:`, error);
      throw error;
    }
  }

  async getAllDocuments(collectionName: string): Promise<admin.firestore.QuerySnapshot> {
    try {
      if (!this.firestore) throw new Error('Firestore not initialized');
      const querySnapshot = await this.firestore.collection(collectionName).get();
      console.log(`Retrieved all documents from ${collectionName}: ${querySnapshot.size} documents`);
      return querySnapshot;
    } catch (error) {
      console.error(`Failed to get all documents from ${collectionName}:`, error);
      throw error;
    }
  }

  // Storage methods
  async uploadFile(filePath: string, buffer: Buffer, metadata?: any): Promise<string> {
    try {
      if (!this.storage) throw new Error('Firebase Storage not initialized');
      const bucket = this.storage.bucket();
      const file = bucket.file(filePath);
      
      await file.save(buffer, {
        metadata: metadata,
        resumable: false,
      });

      // Make the file publicly accessible (optional)
      await file.makePublic();
      
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
      console.log(`File uploaded to ${filePath}`);
      return publicUrl;
    } catch (error) {
      console.error(`Failed to upload file to ${filePath}:`, error);
      throw error;
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      if (!this.storage) throw new Error('Firebase Storage not initialized');
      const bucket = this.storage.bucket();
      await bucket.file(filePath).delete();
      console.log(`File deleted from ${filePath}`);
    } catch (error) {
      console.error(`Failed to delete file from ${filePath}:`, error);
      throw error;
    }
  }

  async getFileDownloadURL(filePath: string): Promise<string> {
    try {
      if (!this.storage) throw new Error('Firebase Storage not initialized');
      const bucket = this.storage.bucket();
      const file = bucket.file(filePath);
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      });
      return url;
    } catch (error) {
      console.error(`Failed to get download URL for ${filePath}:`, error);
      throw error;
    }
  }

  // Batch operations
  async batchWrite(operations: Array<{
    type: 'create' | 'update' | 'delete';
    collection: string;
    docId: string;
    data?: any;
  }>): Promise<void> {
    try {
      if (!this.firestore) throw new Error('Firestore not initialized');
      const batch = this.firestore.batch();

      operations.forEach(op => {
        const docRef = this.firestore!.collection(op.collection).doc(op.docId);
        
        switch (op.type) {
          case 'create':
            batch.set(docRef, op.data);
            break;
          case 'update':
            batch.update(docRef, op.data);
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });

      await batch.commit();
      console.log(`Batch operation completed with ${operations.length} operations`);
    } catch (error) {
      console.error('Failed to execute batch operation:', error);
      throw error;
    }
  }

  // Utility methods
  getFirebaseApp(): admin.app.App | null {
    return this.app;
  }

  getAuth(): admin.auth.Auth | null {
    return this.auth;
  }

  getFirestore(): admin.firestore.Firestore | null {
    return this.firestore;
  }

  getStorage(): admin.storage.Storage | null {
    return this.storage;
  }

  isInitialized(): boolean {
    return !!this.app && !!this.auth && !!this.firestore && !!this.storage;
  }
}