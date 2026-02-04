import { useState, useMemo, useEffect } from 'react'

const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTe01FxUFIrW5g5FGQnFBHpxg3gjgg_zmTL0fkSX_iVFgzTiw3LmLd7VTQmx16RmuxSXZR6uoryXvP9/pub?output=csv';

function App() {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [filtroZona, setFiltroZona] = useState('Todas')
    const [busqueda, setBusqueda] = useState('')

    // Función para formatear moneda
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(GOOGLE_SHEET_URL);
                const csvText = await response.text();

                // Simple CSV Parser para los datos de DeCampoACampo
                const lines = csvText.split(/\r?\n/);
                const headers = lines[0].split(',');

                const rawRows = lines.slice(1).map(line => {
                    // Regex para manejar los campos con comillas y comas (como "30,000")
                    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                    if (!matches) return null;

                    return {
                        usuario: matches[3]?.replace(/"/g, '') || matches[8]?.replace(/"/g, ''),
                        importe: parseFloat(matches[5]?.replace(/"/g, '').replace(/,/g, '')) || 0,
                        categoria: matches[9]?.replace(/"/g, '') || 'Otros',
                        estado: matches[7]?.replace(/"/g, '')
                    };
                }).filter(r => r && r.estado === 'CONFIRMADA');

                // Agrupar por usuario
                const groupedByUser = rawRows.reduce((acc, row) => {
                    if (!acc[row.usuario]) {
                        acc[row.usuario] = {
                            nombre: row.usuario,
                            zona: 'General', // Por ahora lo ponemos general ya que no viene en el CSV
                            gastos: { combustible: 0, comidas: 0, hoteles: 0, otros: 0 },
                            totalMes: 0
                        };
                    }

                    const cat = row.categoria.toLowerCase();
                    if (cat.includes('combustible')) acc[row.usuario].gastos.combustible += row.importe;
                    else if (cat.includes('comida')) acc[row.usuario].gastos.comidas += row.importe;
                    else if (cat.includes('hotel')) acc[row.usuario].gastos.hoteles += row.importe;
                    else acc[row.usuario].gastos.otros += row.importe;

                    acc[row.usuario].totalMes += row.importe;
                    return acc;
                }, {});

                setData(Object.values(groupedByUser));
                setLoading(false);
            } catch (error) {
                console.error('Error cargando datos:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const comercialesFiltrados = useMemo(() => {
        return data.filter(c => {
            const coincideBusqueda = c.nombre.toLowerCase().includes(busqueda.toLowerCase())
            return coincideBusqueda
        });
    }, [data, busqueda])

    const totales = useMemo(() => {
        return comercialesFiltrados.reduce((acc, comercial) => {
            acc.total += comercial.totalMes;
            acc.combustible += comercial.gastos.combustible;
            acc.comidas += comercial.gastos.comidas;
            acc.hoteles += comercial.gastos.hoteles;
            return acc;
        }, { total: 0, combustible: 0, comidas: 0, hoteles: 0 });
    }, [comercialesFiltrados]);

    if (loading) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#ffffff', color: '#1e3a8a', fontFamily: 'Inter' }}>
                <div style={{ textAlign: 'center' }}>
                    <h2>Cargando Dashboard de DeCampoACampo...</h2>
                    <p>Conectando con Google Sheets en vivo</p>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="logo">
                    <div className="logo-icon">🐄</div>
                    <div>
                        <div className="logo-text">DeCampoACampo</div>
                        <div className="logo-subtext">Mercado Ganadero</div>
                    </div>
                </div>

                <ul className="nav-menu">
                    <li className="nav-item active">📊 <span>Dashboard en Vivo</span></li>
                    <li className="nav-item">👥 <span>Asociados</span></li>
                    <li className="nav-item">📋 <span>Reportes</span></li>
                    <li className="nav-item">⚙️ <span>Configuración</span></li>
                </ul>
            </aside>

            <main className="main-content">
                <header className="page-header">
                    <h1 className="page-title">Panel de Control de Gastos</h1>
                    <p className="page-subtitle">Sincronizado automáticamente con Google Sheets</p>
                </header>

                <section className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-title">Gastos Totales (Confirmados)</div>
                        <div className="stat-value">{formatCurrency(totales.total)}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-title">Nafta / Combustible</div>
                        <div className="stat-value">{formatCurrency(totales.combustible)}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-title">Alimentación / Comidas</div>
                        <div className="stat-value">{formatCurrency(totales.comidas)}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-title">Hospedaje / Hoteles</div>
                        <div className="stat-value">{formatCurrency(totales.hoteles)}</div>
                    </div>
                </section>

                <section className="filters-section">
                    <div className="filters-title">Búsqueda Rápida</div>
                    <input
                        type="text"
                        className="filter-input"
                        style={{ width: '100%' }}
                        placeholder="Buscar por nombre de asociado..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </section>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>

                    <section className="table-section">
                        <div className="table-header"><h2 className="table-title">Ranking de Gastos por Usuario</h2></div>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Usuario</th>
                                    <th>Gasto Acumulado</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comercialesFiltrados.map((c, i) => (
                                    <tr key={i}>
                                        <td><strong>{c.nombre}</strong></td>
                                        <td className="amount">{formatCurrency(c.totalMes)}</td>
                                        <td>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem',
                                                background: c.totalMes > 500000 ? '#fef2f2' : '#f0fdf4',
                                                color: c.totalMes > 500000 ? '#991b1b' : '#166534'
                                            }}>
                                                {c.totalMes > 500000 ? 'Revisar' : 'Ok'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    <section className="table-section" style={{ padding: '1.5rem' }}>
                        <h2 className="table-title" style={{ marginBottom: '1.5rem' }}>Visualización de Presupuesto</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {comercialesFiltrados.slice(0, 5).map((c, i) => {
                                const porcentaje = Math.min((c.totalMes / 1000000) * 100, 100);
                                return (
                                    <div key={i}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                                            <span>{c.nombre}</span>
                                            <strong>{formatCurrency(c.totalMes)}</strong>
                                        </div>
                                        <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                            <div style={{
                                                width: `${porcentaje}%`, height: '100%',
                                                background: 'linear-gradient(90deg, #1e3a8a, #3b82f6)',
                                                borderRadius: '6px'
                                            }}></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    )
}

export default App
