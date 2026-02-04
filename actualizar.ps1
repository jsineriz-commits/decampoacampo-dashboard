# 1. Descargar datos nuevos
Write-Host "--- Descargando datos desde Google Sheets ---" -ForegroundColor Cyan
node descargar-datos.js

# 2. Subir cambios a GitHub/Vercel
Write-Host "--- Subiendo cambios a Vercel ---" -ForegroundColor Cyan
git add .
git commit -m "Sincronizacion automatica de datos"
git push

Write-Host "--- Todo listo ---" -ForegroundColor Green
Write-Host "Tus datos privados han sido descargados y subidos a la web."
Write-Host "Espera 30 segundos y refresca decampoacampo-dashboard.vercel.app"

