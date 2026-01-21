# QUANTA AI Agents System

Sistema multi-agente para desarrollo asistido por IA en el proyecto QUANTA.

---

## ⚠️ REGLA CRÍTICA PARA EL ASISTENTE DE IA

> **ANTES de responder a CUALQUIER solicitud del usuario:**
> 
> 1. ✅ Lee [`AGENT_CONSULTATION_RULES.md`](./AGENT_CONSULTATION_RULES.md)
> 2. ✅ Identifica qué agentes son relevantes
> 3. ✅ Consulta la documentación de esos agentes en `agents/`
> 4. ✅ Aplica las guías y patrones establecidos
> 5. ✅ Responde siguiendo las mejores prácticas
>
> **Esta regla es OBLIGATORIA y NO tiene excepciones.**

---

## ¿Qué es este sistema?

Este directorio `.claude/` contiene la configuración y documentación para un sistema de agentes especializados de IA que ayudan en diferentes aspectos del desarrollo de QUANTA. Cada agente tiene conocimiento profundo del proyecto y puede realizar tareas específicas siguiendo las mejores prácticas establecidas.

## Estructura del Sistema

```
.claude/
├── config.json                      # Configuración de agentes
├── AGENT_CONSULTATION_RULES.md     # ⚠️ REGLAS OBLIGATORIAS
├── project-context.md               # Contexto global de QUANTA
├── agents/                          # Agentes especializados
│   ├── orchestrator.md             # Coordinador principal
│   ├── skills-developer.md         # Desarrollo de features
│   ├── ui-ux-designer.md           # Diseño UI/UX
│   ├── data-analyst.md             # Análisis de datos
│   ├── devops-engineer.md          # DevOps
│   ├── code-reviewer.md            # Revisión de código
│   ├── documenter.md               # Documentación
│   ├── tester.md                   # Testing
│   └── architect.md                # Arquitectura
├── prompts/                         # Prompts reutilizables
└── context/                         # Contexto compartido
```

## Agentes Disponibles

### 1. Orchestrator (Coordinador)
**Trigger**: `@orchestrator` o "coordinate"
- Coordina múltiples agentes
- Decide qué agente es mejor para cada tarea
- Resuelve conflictos entre agentes

### 2. Skills Developer (Desarrollador)
**Trigger**: `@skills` o "implement"
- Crea nuevas features
- Desarrolla hooks personalizados
- Implementa servicios
- Sigue patrones existentes del proyecto

### 3. UI/UX Designer (Diseñador)
**Trigger**: `@ui` o `@ux`
- Diseña componentes visuales
- Mantiene consistencia del design system
- Implementa responsive design
- Optimiza accesibilidad

### 4. Data Analyst (Analista de Datos)
**Trigger**: `@analytics` o "analyze"
- Analiza datos financieros
- Genera insights con IA
- Crea predicciones
- Optimiza algoritmos de análisis

### 5. DevOps Engineer
**Trigger**: `@devops` o "deploy"
- Gestiona deployment
- Configura CI/CD
- Optimiza build process
- Monitorea performance

### 6. Code Reviewer (Revisor)
**Trigger**: `@review` o "review code"
- Revisa código
- Detecta problemas de seguridad
- Verifica best practices
- Valida patrones de diseño

### 7. Documenter (Documentador)
**Trigger**: `@docs` o "document"
- Genera documentación
- Crea JSDoc
- Actualiza README
- Documenta arquitectura

### 8. Tester (Tester)
**Trigger**: `@test` o "test"
- Genera tests unitarios
- Crea tests de integración
- Mejora coverage
- Detecta bugs

### 9. Architect (Arquitecto)
**Trigger**: `@architect` o "architecture"
- Diseña arquitectura
- Sugiere refactoring
- Valida patrones
- Planifica escalabilidad

## Cómo Usar los Agentes

### Método 1: Invocación Directa
Usa el trigger del agente en tu mensaje:

```
@skills Por favor implementa un hook para gestionar notificaciones push
```

### Método 2: Pregunta al Orchestrator
Deja que el orchestrator decida:

```
@orchestrator Necesito agregar autenticación biométrica, ¿qué agentes necesito?
```

### Método 3: Invocación Implícita
Simplemente describe la tarea, Claude leerá este archivo y decidirá:

```
Necesito revisar el código de seguridad del authService
→ Claude invocará automáticamente al Code Reviewer
```

## Flujo de Trabajo Recomendado

### Para Features Nuevas:
1. **Architect** → Diseña la arquitectura
2. **Skills Developer** → Implementa la feature
3. **UI/UX Designer** → Diseña la interfaz (si aplica)
4. **Tester** → Genera tests
5. **Code Reviewer** → Revisa el código
6. **Documenter** → Documenta la feature

### Para Bugs:
1. **Code Reviewer** → Identifica el problema
2. **Skills Developer** → Implementa el fix
3. **Tester** → Crea test de regresión
4. **Code Reviewer** → Valida la solución

### Para Refactoring:
1. **Architect** → Analiza y propone mejoras
2. **Code Reviewer** → Identifica código problemático
3. **Skills Developer** → Implementa refactoring
4. **Tester** → Valida que nada se rompió
5. **Documenter** → Actualiza documentación

## Contexto Compartido

Todos los agentes tienen acceso a:
- **project-context.md**: Visión general de QUANTA
- **context/architecture.md**: Arquitectura del sistema
- **context/design-system.md**: Sistema de diseño
- **context/coding-standards.md**: Estándares de código
- **context/tech-stack.md**: Stack tecnológico

## Configuración

La configuración de agentes se encuentra en `config.json`:
- Prioridades de agentes
- Capacidades de cada agente
- Triggers automáticos
- Modo de colaboración
- **Reglas de consulta automática** ⚠️

## Prompts Reutilizables

En `prompts/` encontrarás templates para:
- Code review
- Feature development
- Refactoring
- Testing
- Documentation

## Mejores Prácticas

1. **Sé específico**: Cuanto más detallada sea tu solicitud, mejor será el resultado
2. **Usa triggers**: Los triggers ayudan a invocar el agente correcto
3. **Revisa siempre**: Los agentes son asistentes, no reemplazos del juicio humano
4. **Itera**: No dudes en pedir ajustes o mejoras
5. **Documenta cambios**: Siempre documenta decisiones importantes

## Ejemplo de Uso Completo

```
Usuario: @orchestrator Necesito implementar una feature de análisis de
gastos por categorías con visualización en gráficos de pastel.

Orchestrator: Entendido. Esta tarea requiere:
- @architect: Para diseñar la estructura de datos
- @data-analyst: Para el análisis de datos
- @ui-ux: Para diseñar la visualización
- @skills: Para implementar la feature
- @tester: Para crear tests

¿Procedo con este plan?

Usuario: Sí, procede.

[Los agentes trabajan en secuencia, cada uno en su especialidad]
```

## Actualizaciones

Este sistema de agentes está diseñado para evolucionar. Cuando agregues:
- Nuevos patrones → Actualiza `context/coding-standards.md`
- Nuevos componentes → Actualiza `context/design-system.md`
- Nuevas dependencias → Actualiza `context/tech-stack.md`
- Cambios arquitectónicos → Actualiza `context/architecture.md`

## Soporte

Si un agente no funciona como esperabas:
1. Verifica que estás usando el trigger correcto
2. Revisa que el contexto esté actualizado
3. Sé más específico en tu solicitud
4. Consulta al Orchestrator para coordinar mejor

---

**Versión**: 1.0.0  
**Última actualización**: 2026-01-21  
**Proyecto**: QUANTA Financial Management App

---

## 🚨 RECORDATORIO FINAL

**Para el Asistente de IA:**

Antes de responder a CUALQUIER solicitud:
1. Lee [`AGENT_CONSULTATION_RULES.md`](./AGENT_CONSULTATION_RULES.md)
2. Consulta los agentes relevantes
3. Aplica sus guías y patrones
4. Menciona qué agentes consultaste en tu respuesta

**Esta es una regla OBLIGATORIA del proyecto QUANTA.**
