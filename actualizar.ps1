# Rutas absolutas para evitar errores de "no se reconoce el comando"
$NODE_PATH = "C:\Program Files\nodejs\node.exe"
$GIT_PATH = "C:\Program Files\Git\cmd\git.exe"

# 1. Descargar datos nuevos
Write-Host "--- Descargando datos desde Google Sheets ---" -ForegroundColor Cyan
& $NODE_PATH descargar-datos.cjs

# 2. Subir cambios a GitHub/Vercel
Write-Host "--- Subiendo cambios a Vercel ---" -ForegroundColor Cyan
& $GIT_PATH add .
& $GIT_PATH commit -m "Sincronizacion automatica de datos"
& $GIT_PATH push

Write-Host "--- Todo listo ---" -ForegroundColor Green
Write-Host "Tus datos privados han sido descargados y subidos a la web."
Write-Host "Espera 30 segundos y refresca decampoacampo-dashboard.vercel.app"
