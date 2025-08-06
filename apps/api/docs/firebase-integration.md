# Firebase Integration Documentation

## Descripción General

Esta integración de Firebase proporciona funcionalidades completas para autenticación, base de datos Firestore y almacenamiento de archivos a través de una API REST.

## Configuración

### Variables de Entorno

Las siguientes variables de entorno deben configurarse en el archivo `.env`:

```env
# Firebase Configuration
FIREBASE_API_KEY=AIzaSyD2_XY13xkwvfXjvq3Kmn7qjBlnEzKSL4s
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef123456
FIREBASE_MEASUREMENT_ID=G-ABCDEF123
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
```

### Configuración del Service Account

Para usar Firebase Admin SDK, necesitas:

1. Ir a la consola de Firebase
2. Seleccionar tu proyecto
3. Ir a "Project Settings" > "Service Accounts"
4. Generar una nueva clave privada
5. Copiar el contenido JSON completo a la variable `FIREBASE_SERVICE_ACCOUNT_KEY`

## Endpoints Disponibles

### Autenticación

#### Crear Usuario
```http
POST /api/v1/firebase/auth/users
Content-Type: application/json
Authorization: Bearer <your-jwt-token>

{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "John Doe",
  "emailVerified": false,
  "disabled": false
}
```

#### Obtener Usuario por Email
```http
GET /api/v1/firebase/auth/users/email/user@example.com
Authorization: Bearer <your-jwt-token>
```

#### Obtener Usuario por UID
```http
GET /api/v1/firebase/auth/users/{uid}
Authorization: Bearer <your-jwt-token>
```

#### Actualizar Usuario
```http
PUT /api/v1/firebase/auth/users/{uid}
Content-Type: application/json
Authorization: Bearer <your-jwt-token>

{
  "displayName": "Jane Doe",
  "emailVerified": true,
  "disabled": false
}
```

#### Eliminar Usuario
```http
DELETE /api/v1/firebase/auth/users/{uid}
Authorization: Bearer <your-jwt-token>
```

#### Verificar Token ID
```http
POST /api/v1/firebase/auth/verify-token
Content-Type: application/json
Authorization: Bearer <your-jwt-token>

{
  "idToken": "firebase-id-token"
}
```

#### Crear Token Personalizado
```http
POST /api/v1/firebase/auth/custom-token/{uid}
Content-Type: application/json
Authorization: Bearer <your-jwt-token>

{
  "additionalClaims": {
    "role": "admin",
    "permissions": ["read", "write"]
  }
}
```

### Firestore

#### Crear Documento
```http
POST /api/v1/firebase/firestore/{collection}/{docId}
Content-Type: application/json
Authorization: Bearer <your-jwt-token>

{
  "data": {
    "name": "Product Name",
    "price": 29.99,
    "category": "electronics"
  }
}
```

#### Obtener Documento
```http
GET /api/v1/firebase/firestore/{collection}/{docId}
Authorization: Bearer <your-jwt-token>
```

#### Actualizar Documento
```http
PUT /api/v1/firebase/firestore/{collection}/{docId}
Content-Type: application/json
Authorization: Bearer <your-jwt-token>

{
  "data": {
    "price": 24.99,
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Eliminar Documento
```http
DELETE /api/v1/firebase/firestore/{collection}/{docId}
Authorization: Bearer <your-jwt-token>
```

#### Consultar Documentos
```http
POST /api/v1/firebase/firestore/{collection}/query
Content-Type: application/json
Authorization: Bearer <your-jwt-token>

{
  "field": "category",
  "operator": "==",
  "value": "electronics"
}
```

#### Obtener Todos los Documentos
```http
GET /api/v1/firebase/firestore/{collection}
Authorization: Bearer <your-jwt-token>
```

### Storage

#### Subir Archivo
```http
POST /api/v1/firebase/storage/upload
Content-Type: multipart/form-data
Authorization: Bearer <your-jwt-token>

Form Data:
- file: [archivo a subir]
- filePath: "uploads/images/product.jpg" (opcional)
- metadata: '{"contentType": "image/jpeg"}' (opcional)
```

#### Eliminar Archivo
```http
DELETE /api/v1/firebase/storage/{filePath}
Authorization: Bearer <your-jwt-token>
```

#### Obtener URL de Descarga
```http
GET /api/v1/firebase/storage/{filePath}/download-url
Authorization: Bearer <your-jwt-token>
```

### Health Check

#### Verificar Estado del Servicio
```http
GET /api/v1/firebase/health
Authorization: Bearer <your-jwt-token>
```

## Respuestas de la API

### Formato de Respuesta Exitosa
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // datos específicos de la operación
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Formato de Respuesta de Error
```json
{
  "success": false,
  "message": "Error description: detailed error message",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Códigos de Estado HTTP

- `200` - Operación exitosa
- `201` - Recurso creado exitosamente
- `400` - Solicitud incorrecta (datos faltantes o inválidos)
- `401` - Token de autenticación inválido
- `404` - Recurso no encontrado
- `503` - Servicio no disponible

## Seguridad

- Todos los endpoints requieren autenticación JWT
- Los archivos subidos se almacenan de forma segura en Firebase Storage
- Las operaciones de Firestore respetan las reglas de seguridad configuradas
- Los tokens de Firebase se verifican usando Firebase Admin SDK

## Ejemplos de Uso

### Flujo Completo de Usuario

1. **Crear usuario en Firebase**
```bash
curl -X POST http://localhost:3000/api/v1/firebase/auth/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "displayName": "Test User"
  }'
```

2. **Crear documento de perfil**
```bash
curl -X POST http://localhost:3000/api/v1/firebase/firestore/users/user123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "data": {
      "email": "test@example.com",
      "displayName": "Test User",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }'
```

3. **Subir avatar**
```bash
curl -X POST http://localhost:3000/api/v1/firebase/storage/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@avatar.jpg" \
  -F "filePath=avatars/user123.jpg"
```

## Troubleshooting

### Errores Comunes

1. **"Firebase Auth not initialized"**
   - Verificar que `FIREBASE_SERVICE_ACCOUNT_KEY` esté configurado correctamente
   - Asegurar que el JSON del service account sea válido

2. **"Invalid token"**
   - Verificar que el token JWT sea válido y no haya expirado
   - Confirmar que el usuario tenga permisos para acceder al endpoint

3. **"Document not found"**
   - Verificar que el documento exista en Firestore
   - Confirmar que la colección y el ID del documento sean correctos

4. **"File upload failed"**
   - Verificar que `FIREBASE_STORAGE_BUCKET` esté configurado
   - Confirmar que el archivo no exceda los límites de tamaño
   - Verificar permisos de Firebase Storage

### Logs

Los logs del servicio Firebase se pueden encontrar en la consola del servidor. Buscar mensajes que comiencen con:
- `Firebase Admin initialized successfully`
- `User created with UID:`
- `Document created in`
- `File uploaded to`

## Limitaciones

- Tamaño máximo de archivo: 32MB (configurable en Firebase)
- Límites de Firestore: 1MB por documento
- Rate limits según el plan de Firebase
- Autenticación requerida para todos los endpoints

## Próximos Pasos

1. Implementar middleware de validación más robusto
2. Agregar soporte para operaciones batch en Firestore
3. Implementar caché para consultas frecuentes
4. Agregar métricas y monitoreo
5. Implementar webhooks para eventos de Firebase