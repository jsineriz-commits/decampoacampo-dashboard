const fs = require('fs');
const https = require('https');
const path = require('path');

// ==========================================
// CONFIGURACIÓN (PEGÁ TU API KEY ACÁ)
// ==========================================
const API_KEY = process.env.GOOGLE_API_KEY || 'TU_API_KEY_AQUÍ';
const SHEET_ID = '1VeIxJ2gYMk2ZSlcRF_4wsJBiNIBp4apaW5hmKSILJhE';
// ==========================================

const targetPath = path.join(__dirname, 'public', 'gastos_reales.csv');

// URL para exportar como CSV
const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

console.log('--- Iniciando descarga de datos ---');

function downloadFile(downloadUrl, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(downloadUrl, (res) => {
            // Handle redirects (307, 302, 301)
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                console.log('Siguiendo redireccion...');
                file.close();
                fs.unlinkSync(dest);
                downloadFile(res.headers.location, dest).then(resolve).catch(reject);
                return;
            }

            if (res.statusCode !== 200) {
                reject(new Error(`Error de descarga: ${res.statusCode}`));
                return;
            }

            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { }); // Delete the file on error
            reject(err);
        });
    });
}

downloadFile(url, targetPath)
    .then(() => {
        console.log('Datos guardados correctamente en: ' + targetPath);
        process.exit(0);
    })
    .catch((err) => {
        console.error('Error:', err.message);
        process.exit(1);
    });
