# SECURITY - QUANTA Finance App

## Variables de Entorno

### Desarrollo Local

1. **Crear archivo de configuración:**
   ```bash
   cp .env.example .env.local
   ```

2. **Completar con tus credenciales:**
   - Gemini API Key: https://aistudio.google.com/app/apikey
   - Firebase Config: https://console.firebase.google.com/

3. **NUNCA commitear `.env.local`:**
   - Ya está en `.gitignore`
   - Contiene credenciales sensibles

### Producción (Netlify/Vercel/Firebase Hosting)

Configure estas variables de entorno en su panel de hosting:

```
GEMINI_API_KEY=tu_clave_real
VITE_FIREBASE_API_KEY=tu_clave_real
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
VITE_FIREBASE_MEASUREMENT_ID=tu_measurement_id
```

## Firestore Security Rules

Las reglas de seguridad de Firestore DEBEN estar configuradas para:

1. **Acceso por usuario:**
   - Solo el propietario puede leer/escribir sus datos
   - Usar `request.auth.uid` para validación

2. **Validación de datos:**
   - Montos > 0
   - Fechas válidas
   - Tipos correctos

3. **Protección contra abuso:**
   - Rate limiting básico
   - Validación de tamaño de documentos

Ver archivo `firestore.rules` (cuando se cree) para la implementación completa.

## Regeneración de Credenciales

Si las credenciales fueron comprometidas:

### Gemini API Key
1. Ir a: https://aistudio.google.com/app/apikey
2. Revocar la clave comprometida
3. Generar nueva clave
4. Actualizar en `.env.local` y variables de entorno de producción

### Firebase
1. Firebase Console > Project Settings > General
2. Rotar credenciales si es necesario
3. Actualizar reglas de seguridad
4. Revisar logs de acceso

## Checklist de Seguridad

### Antes de Deploy

- [ ] `.env.local` NO está en git
- [ ] `.env.example` SÍ está en git (sin valores reales)
- [ ] Firestore Security Rules implementadas
- [ ] Variables de entorno configuradas en hosting
- [ ] `drop_console: true` en producción
- [ ] HTTPS habilitado
- [ ] Firebase Auth configurado correctamente

### Monitoreo Continuo

- [ ] Revisar logs de Firebase mensualmente
- [ ] Monitorear uso de Gemini API
- [ ] Verificar accesos no autorizados
- [ ] Actualizar dependencias regularmente

## Reporte de Vulnerabilidades

Si encuentra una vulnerabilidad de seguridad, por favor:

1. NO crear issue público
2. Contactar directamente al equipo de desarrollo
3. Proporcionar detalles técnicos
4. Esperar confirmación antes de divulgar

---

**Última actualización:** 2025-12-12
