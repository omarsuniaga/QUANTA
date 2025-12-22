# 🔧 Correcciones: Recharts Warnings + Rate Limit 429

**Fecha:** 22 de diciembre de 2024  
**Problemas resueltos:** Dimensiones negativas en charts + Errores 429 de Gemini API

---

## ❌ Problemas Originales

### 1. Warning de Recharts
```
The width(-1) and height(-0.4) of chart should be greater than 0
```
**Causa:** ResponsiveContainer con `aspect` puede calcular dimensiones negativas cuando el contenedor aún no tiene tamaño.

### 2. Errores 429 (Too Many Requests)
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent 429
[RateLimiter] Reintento 1/3 en 2000ms
[RateLimiter] Reintento 2/3 en 4000ms
[RateLimiter] Reintento 3/3 en 8000ms
```
**Causa:** Rate limiter demasiado agresivo reintentando errores 429, causando más rate limiting.

---

## ✅ Soluciones Implementadas

### 1. Recharts: Altura Fija + Guards

**Cambios en `Dashboard.tsx`:**

```typescript
// ANTES (problemático)
<ResponsiveContainer width="100%" aspect={2.5} minHeight={200}>
  <BarChart data={barData}>...</BarChart>
</ResponsiveContainer>

// DESPUÉS (corregido)
<div className="w-full min-h-[200px]">
  {isActive && barData.length > 0 ? (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={barData}>...</BarChart>
    </ResponsiveContainer>
  ) : (
    <div className="w-full h-[200px] flex items-center justify-center">
      {/* Placeholder */}
    </div>
  )}
</div>
```

**Mejoras:**
- ✅ Altura fija `height={200}` en lugar de `aspect`
- ✅ Guard `barData.length > 0` para evitar renderizar sin datos
- ✅ Contenedor con `min-h-[200px]` para layout estable
- ✅ Placeholder con altura fija `h-[200px]`

**Aplicado a:**
- BarChart (trend 6 meses)
- PieChart (expense distribution)

---

### 2. Rate Limiter: NO Reintentar 429

**Cambios en `apiRateLimiter.ts`:**

#### A) Configuración más conservadora
```typescript
// ANTES
const DEFAULT_CONFIG = {
  maxRequestsPerMinute: 10,  // Muy agresivo
  maxRetries: 3,
  baseCacheDurationMs: 5 * 60 * 1000,  // 5 min
  enableCache: true
};

// DESPUÉS
const DEFAULT_CONFIG = {
  maxRequestsPerMinute: 5,   // ✅ Más conservador
  maxRetries: 2,              // ✅ Menos reintentos
  baseCacheDurationMs: 10 * 60 * 1000,  // ✅ 10 min cache
  enableCache: true
};
```

#### B) NO reintentar errores 429
```typescript
// ANTES (problemático): Reintentaba 429 → más 429
if (isRateLimitError) {
  const cooldownMs = 30000 * Math.pow(2, consecutiveErrors - 1);  // 30s, 60s, 120s
  // Luego reintentaba...
}

// DESPUÉS (corregido): Cancela inmediatamente
if (isRateLimitError) {
  const cooldownMs = 60000 * Math.pow(2, consecutiveErrors - 1);  // ✅ 60s, 120s, 240s
  
  console.warn(`⏸️ Cooldown activado por ${cooldownMs/1000}s. NO se harán más requests.`);
  
  // ❌ NO reintentar - cancelar inmediatamente
  request.reject(new Error(`Rate limit exceeded. Wait ${cooldownMs/1000}s before retrying.`));
  return;  // ← Salir sin reintentar
}

// Solo reintentar otros errores (network, 5xx, etc.)
if (request.retries < maxRetries) {
  // Backoff más largo: 10s, 20s (antes era 2s, 4s)
  const backoffMs = 5000 * Math.pow(2, request.retries);
  // ...
}
```

**Resultado:**
- ✅ Primer error 429 → Cooldown de 60s, NO reintenta
- ✅ Segundo error 429 → Cooldown de 120s
- ✅ Tercer error 429 → Cooldown de 240s
- ✅ Cache expirado se usa durante cooldown
- ✅ NO más cascadas de reintentos

---

### 3. Error Handling en Componentes AI

**Agregado try-catch en todos los componentes que usan AI:**

```typescript
// AICoachScreen.tsx
const loadAnalysis = async () => {
  setLoading(true);
  try {
    const result = await aiCoachService.analyzeFinances(...);
    setAnalysis(result);
  } catch (error: any) {
    // Silenciar rate limit - el cache se usa automáticamente
    if (error.message?.includes('Rate limit')) {
      console.log('[AICoach] Usando datos en caché por rate limit');
    } else {
      console.error('[AICoach] Error:', error);
    }
  } finally {
    setLoading(false);
  }
};
```

**Componentes actualizados:**
- ✅ `AICoachScreen.tsx`
- ✅ `AICoachWidget.tsx`
- ✅ `StrategiesScreen.tsx`
- ✅ `ChallengesScreen.tsx`

---

## 📊 Comportamiento Mejorado

### Antes (problemático)
```
Usuario abre Dashboard
  → Chart warning (dimensiones negativas)
  → AI request #1 → 429
    → Retry #1 (2s) → 429
    → Retry #2 (4s) → 429
    → Retry #3 (8s) → 429
  → Error final, sin datos
```

### Después (corregido)
```
Usuario abre Dashboard
  ✅ Charts con altura fija, sin warnings
  → AI request #1 → 429
    ✅ Cooldown 60s activado
    ✅ Retorna cache expirado inmediatamente
    ✅ NO reintentos
  ✅ Usuario ve datos del cache
  ✅ Después de 60s, requests normales
```

---

## 🎯 Logs Esperados

### Recharts (ANTES - problemático)
```
Dashboard.tsx:688 The width(-1) and height(-0.4) of chart should be greater than 0
```

### Recharts (DESPUÉS - silencio)
```
(Sin warnings)
```

### Rate Limit (ANTES - cascada de errores)
```
POST .../generateContent 429
[RateLimiter] Error 429 detectado. Errores consecutivos: 1
[RateLimiter] Cooldown activado por 30s
[RateLimiter] Reintento 1/3 en 2000ms
POST .../generateContent 429  ← MÁS 429!
[RateLimiter] Reintento 2/3 en 4000ms
POST .../generateContent 429  ← MÁS 429!
[RateLimiter] Reintento 3/3 en 8000ms
```

### Rate Limit (DESPUÉS - inmediato)
```
POST .../generateContent 429
[RateLimiter] Error 429 detectado. Errores consecutivos: 1
[RateLimiter] ⏸️ Cooldown activado por 60s. NO se harán más requests.
[RateLimiter] ❌ Request cancelado. Usa cache o espera 60s.
[RateLimiter] Retornando cache expirado durante cooldown
[AICoach] Usando datos en caché por rate limit
```

---

## 📝 Archivos Modificados

1. **`components/Dashboard.tsx`**
   - Charts con altura fija (200px)
   - Guards para `barData.length > 0`
   - Contenedores con `min-h-[200px]`

2. **`services/apiRateLimiter.ts`**
   - `maxRequestsPerMinute: 5` (antes 10)
   - `maxRetries: 2` (antes 3)
   - `baseCacheDurationMs: 10min` (antes 5min)
   - NO reintentar errores 429
   - Cooldown más largo (60s, 120s, 240s)

3. **`components/AICoachScreen.tsx`**
   - Try-catch con manejo de rate limit

4. **`components/AICoachWidget.tsx`**
   - Try-catch con manejo de rate limit

5. **`components/StrategiesScreen.tsx`**
   - Try-catch con manejo de rate limit

6. **`components/ChallengesScreen.tsx`**
   - Try-catch con manejo de rate limit

7. **`components/RateLimitBanner.tsx`** (nuevo)
   - Banner UI para mostrar cooldown (opcional, no integrado aún)

---

## ✅ Validación

### 1. Recharts
```bash
# Abrir Dashboard y verificar:
✅ Sin warnings en consola
✅ Charts se renderizan correctamente
✅ Placeholders visibles cuando isActive=false
```

### 2. Rate Limit
```bash
# Provocar rate limit (refrescar muchas veces):
✅ Primer 429 → Cooldown 60s, NO reintentos
✅ Log: "⏸️ Cooldown activado por 60s"
✅ Log: "Usando datos en caché"
✅ Sin cascada de errores
✅ Después de 60s, requests normales
```

---

## 🚀 Próximos Pasos (Opcional)

### A) Integrar RateLimitBanner (UI)
```typescript
// En App.tsx o layout principal
import { RateLimitBanner } from './components/RateLimitBanner';

const [rateLimitRemaining, setRateLimitRemaining] = useState(0);

// Escuchar eventos de rate limit y mostrar banner
{rateLimitRemaining > 0 && (
  <RateLimitBanner remainingSeconds={rateLimitRemaining} />
)}
```

### B) localStorage para cooldown persistente
Actualmente el cooldown se resetea al refrescar la página. Considerar:
```typescript
localStorage.setItem('gemini_cooldown_end', Date.now() + cooldownMs);
```

### C) Mostrar badge "CACHED" en UI
Cuando los datos vienen del cache expirado:
```typescript
<span className="text-xs bg-amber-100 px-2 py-1 rounded">
  📦 Cached data
</span>
```

---

## 📚 Referencia

- **Gemini Free Tier:** ~15 requests/min
- **Config actual:** 5 requests/min (margen de seguridad)
- **Cache duration:** 10 minutos
- **Cooldown progresivo:** 60s → 120s → 240s → max 10min

---

**Estado:** ✅ Implementado  
**Testing:** Pendiente validación del usuario  
**Impacto:** Alto (elimina warnings molestos + reduce errores 429)
