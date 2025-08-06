import { Router } from 'express';
import authRoutes from './auth';
import productRoutes from './products';
import categoryRoutes from './categories';
import orderRoutes from './orders';
import auditRoutes from './audit';
import syncRoutes from './sync';
import firebaseRoutes from './firebase';
import { authenticateToken } from '../middleware/auth';

const router: Router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API documentation
router.get('/docs', (req, res) => {
  res.json({
    title: 'AdminGriffe API',
    version: '1.0.0',
    description: 'Sistema de Auditoría Integral y Sincronización de Bases de Datos',
    endpoints: {
      auth: {
        'POST /api/v1/auth/login': 'User authentication',
        'POST /api/v1/auth/register': 'User registration',
        'POST /api/v1/auth/refresh': 'Refresh access token',
      },
      products: {
        'GET /api/v1/products': 'List products',
        'POST /api/v1/products': 'Create product',
        'GET /api/v1/products/:id': 'Get product by ID',
        'PUT /api/v1/products/:id': 'Update product',
        'DELETE /api/v1/products/:id': 'Delete product',
      },
      audit: {
        'GET /api/v1/audit/logs': 'Retrieve audit logs with filtering',
        'GET /api/v1/audit/trail/:tableName/:recordId': 'Get audit trail for specific record',
        'GET /api/v1/audit/stats': 'Get audit statistics',
        'POST /api/v1/audit/verify': 'Verify audit integrity',
        'GET /api/v1/audit/export': 'Export audit logs to CSV',
        'GET /api/v1/audit/compliance': 'Generate compliance report',
      },
      sync: {
        'GET /api/v1/sync/status': 'Get synchronization status',
        'GET /api/v1/sync/health': 'Get sync service health',
        'POST /api/v1/sync/replay': 'Replay sync operation',
        'GET /api/v1/sync/conflicts': 'Get sync conflicts',
        'POST /api/v1/sync/conflicts/:id/resolve': 'Resolve sync conflict',
        'GET /api/v1/sync/metrics': 'Get sync metrics',
        'GET /api/v1/sync/lag': 'Get sync lag metrics',
        'POST /api/v1/sync/cdc/configure': 'Configure CDC',
        'GET /api/v1/sync/cdc/status': 'Get CDC status',
      },
    },
  });
});

// Public API routes
router.use('/auth', authRoutes);

// Protected API routes (require authentication)
router.use('/products', authenticateToken, productRoutes);
router.use('/categories', authenticateToken, categoryRoutes);
router.use('/orders', authenticateToken, orderRoutes);
router.use('/audit', authenticateToken, auditRoutes);
router.use('/sync', authenticateToken, syncRoutes);
router.use('/firebase', authenticateToken, firebaseRoutes);

export default router;