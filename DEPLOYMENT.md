# Guía de Despliegue - GitHub + Vercel

Esta guía te explica cómo subir tu proyecto a GitHub y desplegarlo en Vercel.

## Requisitos Previos

Antes de comenzar, necesitas:
1. **Node.js** instalado (descárgalo de [nodejs.org](https://nodejs.org))
2. **Git** instalado (descárgalo de [git-scm.com](https://git-scm.com))
3. Una cuenta en **GitHub** ([github.com](https://github.com))
4. Una cuenta en **Vercel** ([vercel.com](https://vercel.com))

---

## Paso 1: Instalar Node.js y Git

### Node.js
1. Ve a https://nodejs.org
2. Descarga la versión "LTS" (la recomendada)
3. Ejecuta el instalador y sigue los pasos
4. Reinicia tu terminal/PowerShell

### Git
1. Ve a https://git-scm.com/download/windows
2. Descarga e instala
3. Durante la instalación, acepta las opciones por defecto

**Verificar instalación:** Abre PowerShell y ejecuta:
```powershell
node --version
npm --version
git --version
```

---

## Paso 2: Instalar Dependencias

Abre PowerShell, navega a la carpeta del proyecto y ejecuta:

```powershell
cd C:\Users\Admin\.gemini\antigravity\scratch\premium-landing-page
npm install
```

Esto instalará React, Vite y otras dependencias.

---

## Paso 3: Probar Localmente

Para ver el proyecto en tu navegador:

```powershell
npm run dev
```

Abre tu navegador en `http://localhost:5173`

---

## Paso 4: Crear Repositorio en GitHub

1. Ve a https://github.com y logueate
2. Click en el botón verde **"New"** (o "Nuevo repositorio")
3. **Nombre:** `decampoacampo-dashboard`
4. **Descripción:** Dashboard de gastos DeCampoACampo
5. Marca "Private" si quieres que sea privado
6. **NO marques** "Add README" ni otras opciones
7. Click en **"Create repository"**

---

## Paso 5: Subir Código a GitHub

Después de crear el repositorio vacío, GitHub te mostrará comandos. Copia y pega estos en tu PowerShell (desde la carpeta del proyecto):

```powershell
cd C:\Users\Admin\.gemini\antigravity\scratch\premium-landing-page
git init
git add .
git commit -m "Primer commit - Dashboard DeCampoACampo"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/decampoacampo-dashboard.git
git push -u origin main
```

> **IMPORTANTE:** Reemplaza `TU_USUARIO` con tu nombre de usuario de GitHub.

---

## Paso 6: Conectar con Vercel

1. Ve a https://vercel.com y logueate (puedes usar tu cuenta de GitHub)
2. Click en **"Add New..."** → **"Project"**
3. Busca el repositorio `decampoacampo-dashboard`
4. Click en **"Import"**
5. Vercel detectará automáticamente que es un proyecto Vite
6. Click en **"Deploy"**

🎉 **¡Listo!** En unos segundos tendrás tu página en una URL como:
`https://decampoacampo-dashboard.vercel.app`

---

## Actualizaciones Automáticas

A partir de ahora, cada vez que hagas un cambio y lo subas a GitHub:

```powershell
git add .
git commit -m "Descripción del cambio"
git push
```

Vercel lo detectará automáticamente y actualizará tu página.

---

## Estructura del Proyecto

```
premium-landing-page/
├── index.html
├── package.json
├── vite.config.js
├── DEPLOYMENT.md    ← Esta guía
├── README.md
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── data/
    │   └── comerciales.js
    └── styles/
        └── index.css
```
