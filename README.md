# TrainPro

Aplicación móvil para entrenadores de getión de entrenamiento físico, desarrollada como parte de un challenge técnico. TrainPro permite crear una cuenta, iniciar sesión y acceder a un área privada mediante una sesión persistente y autenticación gestionada por un backend propio.

## Tecnologías

### Mobile

- React Native
- Expo SDK 58
- Expo Router
- TypeScript
- Axios
- Formik y Yup
- Expo SecureStore

### Backend

- Python 3.11+
- FastAPI
- SQLAlchemy
- Alembic
- Pydantic y Pydantic Settings
- SQLite
- Argon2 (`pwdlib` y `argon2-cffi`)
- Pytest
- Ruff

## Arquitectura del proyecto

```text
fitness-app/
├── backend/
│   ├── migrations/          # Migraciones de base de datos
│   ├── src/
│   │   ├── config/          # Configuración
│   │   ├── dependencies/    # Dependencias de FastAPI
│   │   ├── models/          # Modelos de SQLAlchemy
│   │   ├── routers/         # Endpoints de la API
│   │   ├── schemas/         # Esquemas de validación
│   │   ├── services/        # Lógica de negocio
│   │   └── utils/           # Utilidades
│   ├── tests/               # Pruebas automatizadas
│   ├── .env.example
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   └── alembic.ini
│
├── mobile/
│   ├── app/                 # Rutas y navegación
│   ├── assets/              # Recursos gráficos
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── theme/
│   ├── .env.example
│   └── package.json
│
├── .gitignore
├── pyproject.toml
└── README.md
```

## Requisitos previos

Antes de comenzar, es necesario contar con:

- Python 3.11 o superior.
- Node.js y npm.
- Git.
- Android Studio con un emulador Android, o un dispositivo físico con Expo Go.
- Un entorno de terminal. Los comandos de esta guía están escritos para Windows PowerShell.

## Instalación y ejecución

### 1. Clonar el repositorio

```powershell
git clone https://github.com/Mati-ERojas/Fitness-app_Challenge.git
cd fitness-app_challenge 
```

### 2. Configurar el backend

Ingresar al directorio:

```powershell
cd backend
```

Crear un entorno virtual:

```powershell
py -m venv .venv
```

Activarlo:

```powershell
.\.venv\Scripts\Activate.ps1
```

Instalar las dependencias de ejecución y desarrollo:

```powershell
python -m pip install -r requirements-dev.txt
```

#### Configurar las variables de entorno

Crear el archivo local a partir del ejemplo:

```powershell
Copy-Item .env.example .env.local
```

El archivo `backend/.env.local` contiene la configuración del proyecto. La configuración inicial utiliza SQLite:

```env
PROJECT_NAME=Fitness App API
VERSION=0.1.0
API_V1_STR=/api/v1
DATABASE_URL=sqlite:///./fitness.db
SESSION_EXPIRE_DAYS=7
```

Se pueden modificar estas variables según el entorno de ejecución.

El archivo `.env.local` es local y no debe subirse al repositorio.

#### Inicializar la base de datos

Ejecutar las migraciones:

```powershell
python -m alembic upgrade head
```

Alembic crea y actualiza las tablas de acuerdo con las migraciones disponibles.

#### Iniciar el servidor

```powershell
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

El backend quedará disponible en:

- API: `http://localhost:8000`
- Documentación interactiva: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/v1/health`
- Health check alternativo: `http://localhost:8000/health`

El parámetro `--host 0.0.0.0` permite que otros dispositivos de la red puedan acceder al servidor cuando la configuración de red y firewall lo permita.

### 3. Configurar la aplicación mobile

Abrir una segunda terminal y regresar a la raíz del repositorio:

```powershell
cd ..
cd mobile
```

Instalar las dependencias:

```powershell
npm ci
```

#### Configurar la URL del backend

Crear el archivo de configuración local:

```powershell
Copy-Item .env.example .env.local
```

Editar `mobile/.env.local`:

```env
EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:8000/api/v1
```

Reemplazar `TU_IP_LOCAL` por una dirección IP desde la que el dispositivo pueda alcanzar el backend.

Consideraciones:

- **Dispositivo físico:** utilizar la dirección IP local de la computadora que ejecuta el backend. Ambos dispositivos deben poder comunicarse a través de la red.
- **Emulador Android:** utilizar la dirección IP local de la computadora que ejecuta el backend. En caso de no funcionar, utilizar una dirección accesible desde el emulador. En el emulador estándar de Android Studio, normalmente se puede utilizar `10.0.2.2` para acceder al equipo anfitrión.
- Verificar que el firewall permita las conexiones al puerto `8000`.

La aplicación utiliza esta variable para configurar el cliente HTTP y comunicarse con la API.

#### Iniciar Expo

```powershell
npm run start
```

Desde la terminal de Expo se puede abrir la aplicación en un emulador Android o escanear el código QR con Expo Go, según el dispositivo utilizado.

También están disponibles los siguientes comandos:

```powershell
npm run android
npm run ios
npm run web
```

La disponibilidad de cada plataforma depende del entorno de ejecución y de su configuración.

## Autenticación y gestión de sesiones

La autenticación se implementa mediante tokens opacos generados por el backend.

El flujo general es el siguiente:

1. El usuario se registra o inicia sesión desde la aplicación.
2. El backend valida las credenciales.
3. Las contraseñas se almacenan utilizando hashes Argon2; nunca se guardan en texto plano.
4. Al iniciar sesión, el backend genera un token de sesión aleatorio.
5. El backend almacena el hash SHA-256 del token, no el token original.
6. La aplicación guarda el token original utilizando Expo SecureStore.
7. Las solicitudes protegidas envían el token mediante el encabezado `Authorization: Bearer`.
8. Al iniciar la aplicación, se recupera el token y se valida la sesión mediante el endpoint `/auth/me`.
9. Al cerrar sesión, el backend revoca la sesión y la aplicación elimina el token almacenado.

El estado de autenticación se administra mediante un contexto centralizado. La navegación utiliza rutas protegidas para impedir el acceso a las pantallas privadas cuando no existe una sesión autenticada.

Las sesiones tienen una duración configurable mediante `SESSION_EXPIRE_DAYS`.

## Base de datos y migraciones

El proyecto utiliza SQLite como base de datos local.

La estructura se administra mediante SQLAlchemy y las migraciones de Alembic. Las tablas no se crean automáticamente durante el inicio de FastAPI: es necesario ejecutar las migraciones antes de iniciar el backend.

Para actualizar el esquema:

```powershell
python -m alembic upgrade head
```

Para consultar la revisión aplicada:

```powershell
python -m alembic current
```

La base de datos se genera localmente y no es necesario utilizar servicios externos ni una base de datos en la nube.

## Pruebas y calidad

### Backend

Para ejecutar las pruebas automatizadas:

```powershell
python -m pytest
```

Para realizar el análisis estático:

```powershell
python -m ruff check .
```

**Resultados obtenidos durante la validación del proyecto:**

- 48 pruebas automatizadas exitosas.
- Ruff: `All checks passed!`.

### Pruebas manuales

Se realizaron pruebas funcionales y de seguridad sobre la aplicación y el backend.

Entre los escenarios evaluados se encuentran:

- Registro e inicio de sesión.
- Validación de formularios y credenciales.
- Persistencia y recuperación de sesiones.
- Protección de rutas privadas.
- Cierre y revocación de sesiones.
- Manejo de errores de conectividad.
- Prevención de envíos duplicados.
- Almacenamiento seguro de contraseñas.
- Rate limiting de intentos de autenticación.
- Validación de solicitudes enviadas a la API.

El informe detallado de pruebas funcionales y de seguridad
se encuentra disponible en [`docs/Informe de QA Manual - Challenge Técnico – Matías Rojas.pdf`]

## Decisiones técnicas y consideraciones de seguridad

- Se utiliza SQLite para mantener la base de datos local y evitar dependencias de servicios externos.
- Se eligieron tokens opacos en lugar de JWT para implementar un mecanismo de sesiones revocables desde el backend.
- Se utiliza SHA-256 para almacenar los hashes de los tokens de sesión.
- Las contraseñas se protegen mediante Argon2.
- Expo SecureStore se utiliza para almacenar el token en el dispositivo.
- Axios centraliza las solicitudes HTTP y la configuración de autenticación.
- Pydantic valida los datos recibidos por el backend.
- Alembic permite mantener un historial versionado del esquema de base de datos.

## Limitaciones y mejoras para un entorno productivo

- La comunicación HTTP está destinada al entorno local de desarrollo. Un despliegue productivo requiere HTTPS.
- La configuración CORS actual permite todos los orígenes y debe restringirse antes de un despliegue público.
- SQLite se utiliza como solución local para el alcance del challenge.
- El modo oscuro se aplica exclusivamente en función de la configuración de apariencia del sistema operativo. Actualmente, no existe un selector manual de tema dentro de la aplicación.
- No se implementó un mecanismo de recuperación de contraseña mediante correo electrónico.
- No se implementó la verificación de direcciones de correo electrónico.
- No se encuentra disponible la edición de los datos del perfil de usuario.
- No se implementó la gestión de múltiples sesiones activas por usuario.
- El proyecto no cuenta con configuración ni soporte de despliegue mediante Docker.
- Sería necesario complementar la configuración actual con políticas de infraestructura, monitoreo y gestión de errores adecuadas para producción.

## Uso de herramientas de inteligencia artificial

Se utilizaron herramientas de inteligencia artificial como apoyo durante el desarrollo del proyecto, principalmente para la resolución de problemas técnicos, la generación y revisión de código, la asistencia en tareas de programación y la elaboración de documentación.

Las herramientas utilizadas fueron:

- **Extensión Cline para Visual Studio (Code Google Gemini CLI):** modelo Gemini 3.5 Flash-Lite.
- **Extensión Codex para Visual Studio Code (OpenAI):** modelo 6 Luna.

Estas herramientas se utilizaron como complemento del proceso de desarrollo. Las decisiones técnicas finales, la integración de los componentes y la revisión de las implementaciones fueron responsabilidad del desarrollador.

Las pruebas automatizadas y manuales fueron ejecutadas para comprobar el funcionamiento de la aplicación y verificar los resultados obtenidos.
