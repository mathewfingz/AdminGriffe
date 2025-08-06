#!/usr/bin/env node

/**
 * Script de prueba para verificar la integración de Firebase
 * 
 * Uso: node scripts/test-firebase.js
 * 
 * Asegúrate de que las variables de entorno estén configuradas correctamente
 */

import { FirebaseAdminService } from '../src/services/firebase-admin.service.ts';

async function testFirebaseIntegration() {
  console.log('🔥 Iniciando pruebas de integración de Firebase...\n');

  try {
    // Inicializar el servicio
    let firebaseService;
    try {
      firebaseService = new FirebaseAdminService();
      console.log('✅ Firebase Admin Service inicializado correctamente\n');
    } catch (error) {
      console.error('❌ Error al inicializar Firebase Admin Service:', error.message);
      console.log('\n🔧 Para usar Firebase, necesitas:');
      console.log('   1. Un proyecto Firebase válido');
      console.log('   2. Service Account Key válido en FIREBASE_SERVICE_ACCOUNT_KEY');
      console.log('   3. Variables de entorno correctamente configuradas');
      console.log('\n📖 Consulta docs/firebase-integration.md para más información');
      return;
    }
    
    // Verificar inicialización
    console.log('✅ Verificando inicialización...');
    const isInitialized = firebaseService.isInitialized();
    console.log(`   Estado: ${isInitialized ? 'Inicializado' : 'No inicializado'}\n`);

    if (!isInitialized) {
      console.error('❌ Firebase no se inicializó correctamente');
      process.exit(1);
    }

    // Test 1: Crear usuario de prueba
    console.log('🧪 Test 1: Crear usuario de prueba...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testUser = await firebaseService.createUser({
      email: testEmail,
      password: 'testPassword123',
      displayName: 'Usuario de Prueba',
      emailVerified: false,
      disabled: false
    });
    console.log(`   ✅ Usuario creado con UID: ${testUser.uid}\n`);

    // Test 2: Obtener usuario por email
    console.log('🧪 Test 2: Obtener usuario por email...');
    const retrievedUser = await firebaseService.getUserByEmail(testEmail);
    console.log(`   ✅ Usuario obtenido: ${retrievedUser.displayName} (${retrievedUser.email})\n`);

    // Test 3: Actualizar usuario
    console.log('🧪 Test 3: Actualizar usuario...');
    const updatedUser = await firebaseService.updateUser(testUser.uid, {
      displayName: 'Usuario Actualizado',
      emailVerified: true
    });
    console.log(`   ✅ Usuario actualizado: ${updatedUser.displayName}\n`);

    // Test 4: Crear token personalizado
    console.log('🧪 Test 4: Crear token personalizado...');
    const customToken = await firebaseService.createCustomToken(testUser.uid, {
      role: 'test-user',
      permissions: ['read']
    });
    console.log(`   ✅ Token personalizado creado: ${customToken.substring(0, 50)}...\n`);

    // Test 5: Crear documento en Firestore
    console.log('🧪 Test 5: Crear documento en Firestore...');
    const testDocId = `test-doc-${Date.now()}`;
    const testData = {
      name: 'Documento de Prueba',
      createdAt: new Date().toISOString(),
      userId: testUser.uid,
      status: 'active'
    };
    await firebaseService.createDocument('test-collection', testDocId, testData);
    console.log(`   ✅ Documento creado: test-collection/${testDocId}\n`);

    // Test 6: Obtener documento de Firestore
    console.log('🧪 Test 6: Obtener documento de Firestore...');
    const retrievedDoc = await firebaseService.getDocument('test-collection', testDocId);
    console.log(`   ✅ Documento obtenido: ${retrievedDoc.name}\n`);

    // Test 7: Actualizar documento
    console.log('🧪 Test 7: Actualizar documento...');
    await firebaseService.updateDocument('test-collection', testDocId, {
      name: 'Documento Actualizado',
      updatedAt: new Date().toISOString()
    });
    console.log(`   ✅ Documento actualizado\n`);

    // Test 8: Consultar documentos
    console.log('🧪 Test 8: Consultar documentos...');
    const queryResult = await firebaseService.queryDocuments('test-collection', 'status', '==', 'active');
    console.log(`   ✅ Consulta ejecutada: ${queryResult.size} documentos encontrados\n`);

    // Test 9: Obtener todos los documentos
    console.log('🧪 Test 9: Obtener todos los documentos...');
    const allDocs = await firebaseService.getAllDocuments('test-collection');
    console.log(`   ✅ Documentos obtenidos: ${allDocs.size} documentos en total\n`);

    // Test 10: Probar Storage (crear archivo de prueba)
    console.log('🧪 Test 10: Subir archivo a Storage...');
    const testFileContent = Buffer.from('Este es un archivo de prueba para Firebase Storage');
    const testFilePath = `test-files/test-${Date.now()}.txt`;
    const downloadURL = await firebaseService.uploadFile(testFilePath, testFileContent, {
      contentType: 'text/plain',
      customMetadata: {
        uploadedBy: 'test-script',
        purpose: 'integration-test'
      }
    });
    console.log(`   ✅ Archivo subido: ${testFilePath}`);
    console.log(`   📎 URL de descarga: ${downloadURL}\n`);

    // Test 11: Obtener URL de descarga
    console.log('🧪 Test 11: Obtener URL de descarga...');
    const fileDownloadURL = await firebaseService.getFileDownloadURL(testFilePath);
    console.log(`   ✅ URL obtenida: ${fileDownloadURL.substring(0, 80)}...\n`);

    // Limpieza: Eliminar recursos de prueba
    console.log('🧹 Limpiando recursos de prueba...');
    
    // Eliminar archivo
    await firebaseService.deleteFile(testFilePath);
    console.log('   ✅ Archivo eliminado');

    // Eliminar documento
    await firebaseService.deleteDocument('test-collection', testDocId);
    console.log('   ✅ Documento eliminado');

    // Eliminar usuario
    await firebaseService.deleteUser(testUser.uid);
    console.log('   ✅ Usuario eliminado\n');

    console.log('🎉 ¡Todas las pruebas de Firebase completadas exitosamente!');
    console.log('\n📊 Resumen de pruebas:');
    console.log('   ✅ Autenticación: Crear, obtener, actualizar, eliminar usuarios');
    console.log('   ✅ Tokens: Crear tokens personalizados');
    console.log('   ✅ Firestore: CRUD completo de documentos');
    console.log('   ✅ Consultas: Filtros y obtención masiva');
    console.log('   ✅ Storage: Subir, obtener URL, eliminar archivos');
    console.log('   ✅ Limpieza: Eliminación de recursos de prueba');

  } catch (error) {
    console.error('\n❌ Error durante las pruebas:', error);
    console.error('\n🔍 Posibles causas:');
    console.error('   - Variables de entorno no configuradas correctamente');
    console.error('   - Service Account Key inválido');
    console.error('   - Permisos insuficientes en Firebase');
    console.error('   - Proyecto Firebase no configurado correctamente');
    console.error('\n📖 Consulta la documentación en docs/firebase-integration.md');
    process.exit(1);
  }
}

// Función para verificar variables de entorno
function checkEnvironmentVariables() {
  const requiredVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_API_KEY'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Variables de entorno faltantes:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n📝 Configura estas variables en tu archivo .env');
    process.exit(1);
  }

  console.log('✅ Variables de entorno verificadas\n');
}

// Ejecutar pruebas
async function main() {
  console.log('🔧 Verificando configuración...');
  checkEnvironmentVariables();
  
  await testFirebaseIntegration();
}

// Manejar errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Error no manejado:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Excepción no capturada:', error);
  process.exit(1);
});

// Ejecutar el script
main().catch(console.error);