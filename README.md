# 📋 ClipDev

<div align="center">
  <img src="public/clipDev_logo.png" alt="ClipDev Logo" width="128" height="128" />
  <h3>Gestor inteligente de portapapeles y notas para desarrolladores</h3>
  <p>Rápido, privado, 100% offline y diseñado a medida para Windows.</p>

  [![Electron](https://img.shields.io/badge/Electron-44.x-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
  [![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-7.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
  [![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

---

> ### 🚀 ¿Quieres probar ClipDev sin instalar nada ni usar la consola?
> Si solo quieres usar la aplicación como usuario final, **no necesitas clonar el repositorio ni usar Node.js**.
> 
> Dirígete a la sección de **[Releases (Versiones Publicadas)](https://github.com/NicoVillarroelM/clipDev/releases)** en GitHub y descarga directamente el archivo ejecutable:
> * **`ClipDev 1.0.0.exe` (Portable):** Descarga y haz doble clic para usar de inmediato sin instalar.
> * **`ClipDev Setup 1.0.0.exe` (Instalador):** Crea accesos directos en el Escritorio y Menú Inicio.

---

## 🌟 Características Principales

### 1. 📋 Portapapeles Inteligente
* **Monitoreo en segundo plano:** Detecta automáticamente cualquier texto copiado en tu sistema sin interrumpir tu flujo de trabajo.
* **Detección semántica de contenido:** Identifica automáticamente si lo copiado es:
  * 💻 **Código o comandos de terminal** (JavaScript, TypeScript, HTML, SQL, Git, Docker, etc.).
  * 🔗 **Enlaces y URLs** (con acceso directo para abrirlos con un clic en tu navegador seguro).
  * 🎨 **Colores** (códigos Hexadecimales y RGB con vista previa en miniatura en tiempo real).
  * 📝 **Texto general**.
* **Fijado prioritario (Pin):** Mantén tus fragmentos más importantes en la parte superior.
* **Buscador en tiempo real y filtros:** Encuentra rápidamente cualquier fragmento copiado por tipo o palabra clave.
* **Modal de inspección:** Revisa textos y bloques de código extensos con resaltado y formato limpio.
* **Limpieza rápida:** Borra clips antiguos manteniendo tus elementos fijados protegidos.

### 2. 📝 Bloc de Notas con Formato Enriquecido
* **Editor WYSIWYG completo:** Escribe notas rápidas con soporte para:
  * **Tipografía:** Negrita (`Ctrl+B`), Cursiva (`Ctrl+I`), Subrayado con color de acento (`Ctrl+U`), Tachado y Resaltador.
  * **Estructura:** Encabezados (`H1`, `H2`), Párrafos (`P`), Listas con viñetas y Listas numeradas.
  * **Bloques técnicos:** Citas (`Blockquote`) y Bloques de código preformateados (`Pre / Code`).
  * **Historial y limpieza:** Deshacer (`Undo`), Rehacer (`Redo`) y Quitar formato.
* **Pegado inteligente:** Conserva el formato enriquecido al pegar desde Word, Google Docs o sitios web, y mantiene la sangría en bloques de código.
* **Organización por colores:** Asigna etiquetas visuales a tus notas (Ámbar, Esmeralda, Azul, Púrpura, Rosa o Neutro).
* **Métricas en vivo:** Contador de caracteres y palabras en tiempo real.

### 3. 🔒 100% Privado, Local y Permanente
* **Sin cuentas ni inicio de sesión:** No requiere internet ni sincronización con la nube. Toda tu información te pertenece y se queda en tu equipo.
* **Persistencia física garantizada:** Tus datos se guardan tanto en memoria como en archivos JSON locales físicos dentro de `%APPDATA%\clipDev\` (`clips.json` y `notes.json`). Puedes apagar, reiniciar o desconectar tu PC y todo estará exactamente donde lo dejaste.

### 4. ⌨️ Acceso Rápido Global
* Presiona **`Ctrl + Shift + V`** desde cualquier ventana o juego en Windows para mostrar u ocultar ClipDev al instante.

### 5. 🎨 Personalización y Accesibilidad
* **Temas Claro y Oscuro** con contraste de alta legibilidad.
* **6 Paletas de color de acento:** Ámbar, Esmeralda, Cian, Azul, Violeta y Rosa.
* **Escala de interfaz ajustable:** Soporte para tamaño Normal (100%), Grande (112%) y Muy Grande (125%) para facilitar la lectura.
* **Bilingüe:** Interfaz completa en **Español** e **Inglés** intercambiable con un solo clic.

---

## 🛡️ Seguridad Endurecida

ClipDev sigue las directrices oficiales de seguridad de Electron:
* **Context Isolation:** Habilitado para aislar el proceso de renderizado del entorno de ejecución de Node.js.
* **Sandbox:** Activado (`sandbox: true`) para máxima protección del sistema anfitrión.
* **Node Integration Desactivado:** El renderizador nunca tiene acceso directo al sistema operativo.
* **Política de Seguridad de Contenido (CSP):** Reglas estrictas aplicadas en `index.html`.
* **Manejo seguro de enlaces:** Se impiden navegaciones internas y ventanas emergentes; los enlaces web se abren únicamente a través de `shell.openExternal`.
* **Denegación de permisos:** Permisos sensibles (cámara, micrófono, geolocalización) bloqueados por defecto.

---

## 🚀 Instalación y Ejecución

### Requisitos previos
* [Node.js](https://nodejs.org/) (versión 20 o superior)
* [pnpm](https://pnpm.io/) (versión 9 o superior recomendada)

### Instalación de dependencias
```bash
pnpm install
```

### Ejecutar en modo desarrollo
Inicia Vite y Electron simultáneamente con recarga en vivo (HMR):
```bash
pnpm run dev
```

---

## 📦 Generación de Ejecutables para Windows

Para usar ClipDev de forma independiente sin abrir terminales ni servidores:

| Comando | Descripción | Archivo resultante |
| :--- | :--- | :--- |
| `pnpm run dist:dir` | **Desempaquetado (Arranque instantáneo)** | `release/win-unpacked/ClipDev.exe` |
| `pnpm run dist:portable` | **Portable (Ejecutable único sin instalar)** | `release/ClipDev 1.0.0.exe` |
| `pnpm run dist` | **Instalador estándar de Windows (NSIS)** | `release/ClipDev Setup 1.0.0.exe` |

> **Tip de rendimiento:** Para un arranque instantáneo (en menos de 1 segundo), ejecuta directamente `release/win-unpacked/ClipDev.exe` o créale un acceso directo en tu Escritorio.

---

## 📁 Estructura del Proyecto

```text
clipDev/
├── electron/
│   ├── main.ts              # Proceso principal de Electron, atajos globales y almacenamiento
│   └── preload.ts           # Puente seguro IPC expuesto a React (ContextBridge)
├── public/
│   ├── clipDev_logo.ico     # Icono nativo de Windows (multi-resolución)
│   └── clipDev_logo.png     # Favicon público
├── src/
│   ├── assets/              # Recursos gráficos optimizados del frontend
│   │   └── clipDev_logo.png
│   ├── components/          # Componentes modulares de React
│   │   ├── ClipCard.tsx           # Tarjeta individual del historial
│   │   ├── ClipModal.tsx          # Modal para ver y copiar código extenso
│   │   ├── ClipSkeleton.tsx       # Esqueleto de carga inicial fluido
│   │   ├── ConfirmDeleteModal.tsx # Diálogo de confirmación para borrar
│   │   ├── NotesView.tsx          # Editor enriquecido de notas
│   │   ├── ThemeSelector.tsx      # Selector visual de paletas
│   │   └── TitleBar.tsx           # Barra de título arrastrable personalizada
│   ├── locales/
│   │   └── translations.ts  # Textos y traducciones completas en ES y EN
│   ├── types/
│   │   ├── clip.ts          # Interfaces de Clips y Notas
│   │   ├── electron.d.ts    # Tipado seguro para window.electronAPI
│   │   └── theme.ts         # Tipado de temas, modos y escalas
│   ├── utils/
│   │   └── detector.ts      # Detección heurística de código, URLs y colores
│   ├── App.css              # Variables CSS de temas, editor de notas y estilos
│   ├── App.tsx              # Componente raíz y orquestador del estado
│   └── main.tsx             # Punto de entrada de React con ErrorBoundary
├── index.html               # Plantilla HTML base con CSP estricto
├── package.json             # Scripts y configuración de empaquetado
├── tsconfig.json            # Configuración estricta de TypeScript
└── vite.config.ts           # Configuración de Vite con plugins de Electron y Tailwind
```

---

## 💾 Dónde se almacenan tus datos

Toda la información se guarda de forma persistente y privada en tu usuario de Windows:

```text
%APPDATA%\clipDev\
├── clips.json   # Historial completo de clips copiados
└── notes.json   # Colección de notas enriquecidas
```

Puedes respaldar, copiar o migrar estos dos archivos en cualquier momento para mover tus datos a otro equipo.

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para más detalles.
