<div align="center">
<img width="1200" height="475" alt="QUANTA Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# QUANTA - Finance Tracker

Una aplicación financiera personal moderna construida con React, TypeScript y Firebase, diseñada para ayudarte a gestionar tus ingresos, gastos, metas y suscripciones de manera inteligente y visual.

## 🌟 Características Principales

### 💳 Gestión Financiera Completa
- **Registro de Transacciones**: Añade ingresos y gastos con categorías personalizadas
- **Seguimiento en Tiempo Real**: Visualiza tu balance actual y flujo de efectivo
- **Múltiples Monedas**: Soporte para diferentes divisas con tasas de cambio automáticas
- **Métodos de Pago**: Registra transacciones en efectivo, tarjeta, transferencia o cuenta

### 📊 Dashboard Interactivo
- **Estadísticas Visuales**: Gráficos de ingresos vs gastos usando Recharts
- **Balance Disponible**: Muestra claramente cuánto dinero tienes disponible hoy
- **Alertas de Dinero Fantasma**: Detecta posibles cargos duplicados automáticamente
- **Widgets Personalizables**: Acceso rápido a tus funciones más utilizadas

### 🎯 Gestión de Metas Financieras
- **Metas de Ahorro**: Define objetivos financieros con montos y fechas límite
- **Seguimiento de Progreso**: Visualiza el avance hacia tus metas
- **Contribuciones Flexibles**: Añade dinero a tus metas cuando quieras

### 🔄 Gestión de Suscripciones
- **Control de Servicios**: Registra tus suscripciones mensuales/anuales
- **Recordatorios Automáticos**: Recibe notificaciones antes de los cargos
- **Seguimiento de Costos**: Visualiza cuánto gastas en servicios recurrentes

### 🤖 Inteligencia Artificial Integrada
- **Asistente Financiero**: Obtén insights personalizados usando Google Gemini AI
- **Categorización Inteligente**: La IA ayuda a clasificar tus transacciones
- **Predicciones de Gastos**: Anticipa tus futuros gastos basados en tu historial

### 🔔 Sistema de Notificaciones
- **Notificaciones Push**: Alertas en tiempo real sobre tu actividad financiera
- **Recordatorios de Pagos**: Nunca olvides una fecha de vencimiento
- **Alertas Personalizables**: Configura notificaciones según tus necesidades

### 🌍 Soporte Multiidioma
- **Español e Inglés**: Interfaz completamente traducida
- **Cambios Rápidos**: Switch instantáneo entre idiomas

### 🎨 Tema Oscuro/Claro
- **Modo Oscuro**: Protege tus ojos en ambientes con poca luz
- **Tema Automático**: Se adapta a las preferencias de tu sistema
- **Transiciones Suaves**: Cambios elegantes entre temas

### 🔒 Seguridad y Privacidad
- **Autenticación Firebase**: Login seguro con email y contraseña
- **Datos Encriptados**: Tu información financiera está protegida
- **Control de Acceso**: Solo tú puedes ver tus datos financieros

### 📱 Diseño Responsive
- **Mobile-First**: Optimizado para dispositivos móviles
- **Interfaz Intuitiva**: Navegación simple y elegante
- **Animaciones Fluidas**: Experiencia de usuario moderna

## 🛠️ Stack Tecnológico

### Frontend
- **React 19.2.1** - Librería principal de UI
- **TypeScript** - Tipado estático para mayor robustez
- **Vite** - Build tool rápido y moderno
- **Tailwind CSS** - Framework de CSS para estilos
- **Lucide React** - Iconos modernos y consistentes

### Backend & Servicios
- **Firebase 12.6.0** - Autenticación y base de datos
- **Google Gemini AI** - Procesamiento de lenguaje natural
- **Firebase Hosting** - Despliegue y hosting

### Visualización
- **Recharts 3.5.1** - Gráficos interactivos y personalizables

## 🚀 Instalación y Ejecución

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Cuenta Firebase (opcional para desarrollo)

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/omarsuniaga/QUANTA.git
   cd QUANTA
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   - Copia `.env.local.example` a `.env.local`
   - Configura tu `GEMINI_API_KEY` para funcionalidades de IA
   
   ```bash
   # .env.local
   GEMINI_API_KEY=tu_api_key_aqui
   ```

4. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```
   
   La aplicación estará disponible en `http://localhost:3000`

## 📦 Build y Despliegue

### Build para Producción
```bash
npm run build
```

### Despliegue en Firebase Hosting
```bash
# Desplegar solo hosting
firebase deploy --only hosting

# Desplegar todos los servicios
firebase deploy
```

### Vista Previa Local
```bash
npm run preview
```

## 🏗️ Estructura del Proyecto

```
QUANTA/
├── components/          # Componentes React reutilizables
│   ├── Dashboard.tsx   # Panel principal con estadísticas
│   ├── TransactionList.tsx # Lista de transacciones
│   ├── TransactionForm.tsx # Formulario para añadir/editar
│   └── ...             # Otros componentes UI
├── contexts/           # Contextos de React para estado global
│   ├── AuthContext.tsx # Gestión de autenticación
│   ├── TransactionsContext.tsx # Estado de transacciones
│   └── SettingsContext.tsx # Configuración de la app
├── services/           # Servicios externos y API
│   ├── storageService.ts # Gestión de almacenamiento
│   └── pushNotificationService.ts # Notificaciones push
├── types.ts           # Definiciones de tipos TypeScript
├── constants.ts       # Constantes y configuraciones
├── firebaseConfig.ts  # Configuración de Firebase
├── App.tsx           # Componente principal de la aplicación
├── index.tsx         # Punto de entrada de React
└── index.html        # Plantilla HTML principal
```

## 🔧 Configuración

### Firebase
1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita Authentication (Email/Password)
3. Configura Firestore Database
4. Activa Hosting
5. Descarga el archivo de configuración y reemplaza `firebaseConfig.ts`

### Google Gemini AI
1. Obtén tu API key en [Google AI Studio](https://aistudio.google.com/)
2. Añádela a tu archivo `.env.local`
3. Activa las funcionalidades de IA en la configuración de la app

## 📱 Funcionalidades Detalladas

### Gestión de Transacciones
- **Categorías Predefinidas**: Salary, Freelance, Investments, Housing, Food, Utilities, etc.
- **Frecuencia de Recurrencia**: Configura transacciones recurrentes (semanal, mensual, anual)
- **Notas y Estado Emocional**: Añade contexto a tus transacciones
- **Importe de Recibos**: Guarda imágenes de recibos y facturas

### Dashboard y Análisis
- **Gráficos de Tendencias**: Visualiza la evolución de tus finanzas
- **Distribución por Categorías**: Entiende dónde va tu dinero
- **Proyecciones Futuras**: Basadas en tus patrones de gasto
- **Alertas Inteligentes**: Detección de anomalías y gastos inusuales

### Metas y Objetivos
- **Metas de Ahorro**: Define objetivos con montos específicos
- **Plazos Personalizables**: Establece fechas límite motivadoras
- **Seguimiento Visual**: Indicadores de progreso claros
- **Contribuciones Flexibles**: Añade dinero cuando puedas

### Suscripciones y Servicios
- **Control de Costos**: Lista todas tus suscripciones activas
- **Recordatorios Inteligentes**: Alertas antes de los cargos automáticos
- **Análisis de Servicios**: Identifica servicios que podrías cancelar
- **Gestión de Ciclos**: Soporte para ciclos de facturación diferentes

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - mira el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

¿Tienes problemas o preguntas?

- Abre un [issue](https://github.com/omarsuniaga/QUANTA/issues) en GitHub
- Revisa la [documentación](https://github.com/omarsuniaga/QUANTA/wiki)
- Contacta al desarrollador

## 🌐 Demo en Vivo

Prueba la aplicación en vivo: [https://quanta-b5c5d.web.app](https://quanta-b5c5d.web.app)

---

**Hecho con ❤️ para ayudarte a tomar control de tus finanzas personales**
