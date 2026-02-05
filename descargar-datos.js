const fs = require('fs');
const https = require('https');
const path = require('path');

// ==========================================
// CONFIGURACIÓN (PEGÁ TU API KEY ACÁ)
// ==========================================
const API_KEY = 'AIzaSyD2xBSdB5m-XA6XugA_QrouPWFhq2m2Fss';
const SHEET_ID = '1VeIxJ2gYMk2ZSlcRF_4wsJBiNIBp4apaW5hmKSILJhE';
const SHEET_NAME = 'basemendelgastos'; // O el nombre de la hoja exacta
// ==========================================

const targetPath = path.join(__dirname, 'public', 'gastos_reales.csv');

// URL para exportar como CSV usando la API Key
const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&key=${API_KEY}`;

console.log('--- Iniciando descarga de datos privados ---');

https.get(url, (res) => {
    if (res.statusCode !== 200) {
        console.error(`Error de descarga: ${res.statusCode}. Verifica que la API Key sea correcta y laSheets API esté habilitada.`);
        return;
    }

    const file = fs.createWriteStream(targetPath);
    res.pipe(file);

    file.on('finish', () => {
        file.close();
        console.log('✅ Datos guardados correctamente en: ' + targetPath);
        process.exit(0);
    });
}).on('error', (err) => {
    console.error('Error de conexión:', err.message);
});
