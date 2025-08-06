import { Router, Request, Response } from 'express';
import multer from 'multer';
import { FirebaseAdminService } from '../services/firebase-admin.service.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Firebase Admin Service
const firebaseAdminService = new FirebaseAdminService();

// Helper function for error handling
const handleError = (res: Response, error: any, message: string, statusCode: number = 400) => {
  console.error(`${message}:`, error);
  res.status(statusCode).json({
    success: false,
    message: `${message}: ${error.message}`,
    timestamp: new Date().toISOString()
  });
};

// Helper function for success response
const handleSuccess = (res: Response, data: any, message?: string, statusCode: number = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

// ===== AUTHENTICATION ENDPOINTS =====

// Create a new Firebase user
router.post('/auth/users', async (req: Request, res: Response) => {
  try {
    const { email, password, displayName, photoURL, emailVerified, disabled } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        timestamp: new Date().toISOString()
      });
    }

    const userRecord = await firebaseAdminService.createUser({
      email,
      password,
      displayName,
      photoURL,
      emailVerified,
      disabled
    });

    handleSuccess(res, {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      emailVerified: userRecord.emailVerified,
      disabled: userRecord.disabled,
      creationTime: userRecord.metadata.creationTime,
    }, 'User created successfully', 201);
  } catch (error: any) {
    handleError(res, error, 'Failed to create user');
  }
});

// Get user by email
router.get('/auth/users/email/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const userRecord = await firebaseAdminService.getUserByEmail(email);
    
    handleSuccess(res, {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      emailVerified: userRecord.emailVerified,
      disabled: userRecord.disabled,
      lastSignInTime: userRecord.metadata.lastSignInTime,
      creationTime: userRecord.metadata.creationTime,
    });
  } catch (error: any) {
    handleError(res, error, 'User not found', 404);
  }
});

// Get user by UID
router.get('/auth/users/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const userRecord = await firebaseAdminService.getUserByUid(uid);
    
    handleSuccess(res, {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      emailVerified: userRecord.emailVerified,
      disabled: userRecord.disabled,
      lastSignInTime: userRecord.metadata.lastSignInTime,
      creationTime: userRecord.metadata.creationTime,
    });
  } catch (error: any) {
    handleError(res, error, 'User not found', 404);
  }
});

// Update user
router.put('/auth/users/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { displayName, photoURL, emailVerified, disabled } = req.body;
    
    const userRecord = await firebaseAdminService.updateUser(uid, {
      displayName,
      photoURL,
      emailVerified,
      disabled
    });
    
    handleSuccess(res, {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      emailVerified: userRecord.emailVerified,
      disabled: userRecord.disabled,
    }, 'User updated successfully');
  } catch (error: any) {
    handleError(res, error, 'Failed to update user');
  }
});

// Delete user
router.delete('/auth/users/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    await firebaseAdminService.deleteUser(uid);
    
    handleSuccess(res, { uid }, 'User deleted successfully');
  } catch (error: any) {
    handleError(res, error, 'Failed to delete user');
  }
});

// Verify Firebase ID token
router.post('/auth/verify-token', async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'ID token is required',
        timestamp: new Date().toISOString()
      });
    }

    const decodedToken = await firebaseAdminService.verifyIdToken(idToken);
    
    handleSuccess(res, {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      authTime: decodedToken.auth_time,
      iat: decodedToken.iat,
      exp: decodedToken.exp,
    }, 'Token verified successfully');
  } catch (error: any) {
    handleError(res, error, 'Invalid token', 401);
  }
});

// Create custom token for user
router.post('/auth/custom-token/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { additionalClaims } = req.body;
    
    const customToken = await firebaseAdminService.createCustomToken(uid, additionalClaims);
    
    handleSuccess(res, { customToken }, 'Custom token created successfully');
  } catch (error: any) {
    handleError(res, error, 'Failed to create custom token');
  }
});

// ===== FIRESTORE ENDPOINTS =====

// Create document in Firestore
router.post('/firestore/:collection/:docId', async (req: Request, res: Response) => {
  try {
    const { collection, docId } = req.params;
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'Document data is required',
        timestamp: new Date().toISOString()
      });
    }

    await firebaseAdminService.createDocument(collection, docId, data);
    
    handleSuccess(res, { collection, docId }, 'Document created successfully', 201);
  } catch (error: any) {
    handleError(res, error, 'Failed to create document');
  }
});

// Get document from Firestore
router.get('/firestore/:collection/:docId', async (req: Request, res: Response) => {
  try {
    const { collection, docId } = req.params;
    const data = await firebaseAdminService.getDocument(collection, docId);
    
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
        timestamp: new Date().toISOString()
      });
    }
    
    handleSuccess(res, { collection, docId, data });
  } catch (error: any) {
    handleError(res, error, 'Failed to get document');
  }
});

// Update document in Firestore
router.put('/firestore/:collection/:docId', async (req: Request, res: Response) => {
  try {
    const { collection, docId } = req.params;
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'Document data is required',
        timestamp: new Date().toISOString()
      });
    }

    await firebaseAdminService.updateDocument(collection, docId, data);
    
    handleSuccess(res, { collection, docId }, 'Document updated successfully');
  } catch (error: any) {
    handleError(res, error, 'Failed to update document');
  }
});

// Delete document from Firestore
router.delete('/firestore/:collection/:docId', async (req: Request, res: Response) => {
  try {
    const { collection, docId } = req.params;
    await firebaseAdminService.deleteDocument(collection, docId);
    
    handleSuccess(res, { collection, docId }, 'Document deleted successfully');
  } catch (error: any) {
    handleError(res, error, 'Failed to delete document');
  }
});

// Query documents in Firestore collection
router.post('/firestore/:collection/query', async (req: Request, res: Response) => {
  try {
    const { collection } = req.params;
    const { field, operator, value } = req.body;
    
    if (!field || !operator || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Field, operator, and value are required for query',
        timestamp: new Date().toISOString()
      });
    }

    const querySnapshot = await firebaseAdminService.queryDocuments(collection, field, operator, value);
    
    const documents: any[] = [];
    querySnapshot.forEach((doc: any) => {
      documents.push({
        id: doc.id,
        data: doc.data()
      });
    });
    
    handleSuccess(res, {
      collection,
      query: { field, operator, value },
      count: documents.length,
      documents
    });
  } catch (error: any) {
    handleError(res, error, 'Failed to query documents');
  }
});

// Get all documents from Firestore collection
router.get('/firestore/:collection', async (req: Request, res: Response) => {
  try {
    const { collection } = req.params;
    const querySnapshot = await firebaseAdminService.getAllDocuments(collection);
    
    const documents: any[] = [];
    querySnapshot.forEach((doc: any) => {
      documents.push({
        id: doc.id,
        data: doc.data()
      });
    });
    
    handleSuccess(res, {
      collection,
      count: documents.length,
      documents
    });
  } catch (error: any) {
    handleError(res, error, 'Failed to get documents');
  }
});

// ===== STORAGE ENDPOINTS =====

// Upload file to Firebase Storage
router.post('/storage/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const { filePath, metadata } = req.body;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
        timestamp: new Date().toISOString()
      });
    }

    const parsedMetadata = metadata ? JSON.parse(metadata) : undefined;
    const finalFilePath = filePath || `uploads/${Date.now()}_${file.originalname}`;
    
    const downloadURL = await firebaseAdminService.uploadFile(
      finalFilePath,
      file.buffer,
      parsedMetadata
    );
    
    handleSuccess(res, {
      filePath: finalFilePath,
      downloadURL,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype
    }, 'File uploaded successfully', 201);
  } catch (error: any) {
    handleError(res, error, 'Failed to upload file');
  }
});

// Delete file from Firebase Storage
router.delete('/storage/:filePath(*)', async (req: Request, res: Response) => {
  try {
    const filePath = req.params.filePath;
    await firebaseAdminService.deleteFile(filePath);
    
    handleSuccess(res, { filePath }, 'File deleted successfully');
  } catch (error: any) {
    handleError(res, error, 'Failed to delete file');
  }
});

// Get download URL for file in Firebase Storage
router.get('/storage/:filePath(*)/download-url', async (req: Request, res: Response) => {
  try {
    const filePath = req.params.filePath;
    const downloadURL = await firebaseAdminService.getFileDownloadURL(filePath);
    
    handleSuccess(res, { filePath, downloadURL });
  } catch (error: any) {
    handleError(res, error, 'Failed to get download URL');
  }
});

// ===== HEALTH CHECK ENDPOINT =====

// Check Firebase service health
router.get('/health', async (req: Request, res: Response) => {
  try {
    const isInitialized = firebaseAdminService.isInitialized();
    
    handleSuccess(res, {
      status: isInitialized ? 'healthy' : 'unhealthy',
      initialized: isInitialized,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    handleError(res, error, 'Firebase service health check failed', 503);
  }
});

export default router;