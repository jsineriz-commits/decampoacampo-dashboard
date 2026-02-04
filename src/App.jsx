import { useState, useMemo, useEffect } from 'react'

const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTe01FxUFIrW5g5FGQnFBHpxg3gjgg_zmTL0fkSX_iVFgzTiw3LmLd7VTQmx16RmuxSXZR6uoryXvP9/pub?output=csv';

// Colores para categorías
const CATEGORY_COLORS = {
    'Combustible': '#ef4444',
    'Comidas': '#f97316',
    'Hoteleria': '#3b82f6',
    'Peajes': '#8b5cf6',
    'Otros': '#6b7280',
    'Servicios': '#10b981',
    'Service / Reparaciones Auto': '#ec4899',
    'Monotributo/Autonomos': '#14b8a6'
};

const MESES = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' }
];

function App() {
    const [rawData, setRawData] = useState([])
    const [loading, setLoading] = useState(true)
    const [anio, setAnio] = useState('2025')
    const [mes, setMes] = useState('06')
    const [busqueda, setBusqueda] = useState('')

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
                const lines = csvText.split(/\r?\n/);

                const parsed = lines.slice(1).map(line => {
                    const matches = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
                    if (!matches || matches.length < 11) return null;

                    return {
                        usuario: (matches[8] || '').replace(/"/g, '').trim(),
                        importe: parseFloat((matches[5] || '0').replace(/"/g, '').replace(/,/g, '')) || 0,
                        categoria: (matches[9] || 'Otros').replace(/"/g, '').trim(),
                        estado: (matches[7] || '').replace(/"/g, '').trim(),
                        periodo: (matches[10] || '').replace(/"/g, '').trim(),
                        metodoPago: (matches[6] || '').replace(/"/g, '').trim()
                    };
                }).filter(r => r && r.estado === 'CONFIRMADA' && r.usuario);

                setRawData(parsed);
                setLoading(false);
            } catch (error) {
                console.error('Error cargando datos:', error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filtrar por período seleccionado
    const dataFiltrada = useMemo(() => {
        const periodoSeleccionado = `${anio}${mes}`;
        return rawData.filter(r => r.periodo === periodoSeleccionado);
    }, [rawData, anio, mes]);

    // Filtrar por búsqueda de usuario
    const dataConBusqueda = useMemo(() => {
        if (!busqueda) return dataFiltrada;
        return dataFiltrada.filter(r => r.usuario.toLowerCase().includes(busqueda.toLowerCase()));
    }, [dataFiltrada, busqueda]);

    // Top 5 categorías
    const top5Categorias = useMemo(() => {
        const porCategoria = dataConBusqueda.reduce((acc, r) => {
            acc[r.categoria] = (acc[r.categoria] || 0) + r.importe;
            return acc;
        }, {});
        return Object.entries(porCategoria)
            .map(([cat, total]) => ({ categoria: cat, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    }, [dataConBusqueda]);

    // Ranking de usuarios
    const rankingUsuarios = useMemo(() => {
        const porUsuario = dataConBusqueda.reduce((acc, r) => {
            acc[r.usuario] = (acc[r.usuario] || 0) + r.importe;
            return acc;
        }, {});
        return Object.entries(porUsuario)
            .map(([nombre, total]) => ({ nombre, total }))
            .sort((a, b) => b.total - a.total);
    }, [dataConBusqueda]);

    // Todas las categorías para el gráfico
    const todasCategorias = useMemo(() => {
        const porCategoria = dataConBusqueda.reduce((acc, r) => {
            acc[r.categoria] = (acc[r.categoria] || 0) + r.importe;
            return acc;
        }, {});
        return Object.entries(porCategoria)
            .map(([cat, total]) => ({ categoria: cat, total }))
            .sort((a, b) => b.total - a.total);
    }, [dataConBusqueda]);

    const maxCategoria = Math.max(...todasCategorias.map(c => c.total), 1);

    // Años disponibles
    const aniosDisponibles = useMemo(() => {
        const anios = [...new Set(rawData.map(r => r.periodo.substring(0, 4)))].sort();
        return anios.length > 0 ? anios : ['2025'];
    }, [rawData]);

    if (loading) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#ffffff', color: '#1e3a8a', fontFamily: 'Inter' }}>
                <div style={{ textAlign: 'center' }}>
                    <h2>Cargando Dashboard...</h2>
                    <p>Conectando con Google Sheets</p>
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
                    <li className="nav-item active">📊 <span>Dashboard</span></li>
                    <li className="nav-item">👥 <span>Asociados</span></li>
                    <li className="nav-item">📋 <span>Reportes</span></li>
                </ul>
            </aside>

            <main className="main-content">
                <header className="page-header">
                    <h1 className="page-title">Panel de Gastos</h1>
                    <p className="page-subtitle">Datos en vivo desde Google Sheets</p>
                </header>

                {/* Filtros de Período */}
                <section className="filters-section">
                    <div className="filters-title">Filtrar por Período</div>
                    <div className="filters-grid">
                        <div className="filter-group">
                            <label className="filter-label">Año</label>
                            <select className="filter-select" value={anio} onChange={(e) => setAnio(e.target.value)}>
                                {aniosDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label className="filter-label">Mes</label>
                            <select className="filter-select" value={mes} onChange={(e) => setMes(e.target.value)}>
                                {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label className="filter-label">Buscar Usuario</label>
                            <input
                                type="text"
                                className="filter-input"
                                placeholder="Nombre..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                {/* Top 5 Categorías */}
                <section className="stats-grid">
                    {top5Categorias.map((cat, i) => (
                        <div className="stat-card" key={i} style={{ borderTop: `4px solid ${CATEGORY_COLORS[cat.categoria] || '#6b7280'}` }}>
                            <div className="stat-title">{cat.categoria}</div>
                            <div className="stat-value">{formatCurrency(cat.total)}</div>
                        </div>
                    ))}
                </section>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginTop: '2rem' }}>

                    {/* Ranking de Usuarios */}
                    <section className="table-section">
                        <div className="table-header">
                            <h2 className="table-title">Ranking de Gastos ({MESES.find(m => m.value === mes)?.label} {anio})</h2>
                        </div>
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Usuario</th>
                                        <th>Total</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rankingUsuarios.map((u, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 700, color: i < 3 ? '#1e3a8a' : '#6b7280' }}>{i + 1}</td>
                                            <td><strong>{u.nombre}</strong></td>
                                            <td className="amount">{formatCurrency(u.total)}</td>
                                            <td>
                                                <span style={{
                                                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem',
                                                    background: u.total > 500000 ? '#fef2f2' : '#f0fdf4',
                                                    color: u.total > 500000 ? '#991b1b' : '#166534'
                                                }}>
                                                    {u.total > 500000 ? 'Revisar' : 'Ok'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Gráfico de Barras por Categoría */}
                    <section className="table-section" style={{ padding: '1.5rem' }}>
                        <h2 className="table-title" style={{ marginBottom: '1.5rem' }}>Distribución por Categoría</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {todasCategorias.map((cat, i) => {
                                const porcentaje = (cat.total / maxCategoria) * 100;
                                const color = CATEGORY_COLORS[cat.categoria] || '#6b7280';
                                return (
                                    <div key={i}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: color }}></span>
                                                {cat.categoria}
                                            </span>
                                            <strong>{formatCurrency(cat.total)}</strong>
                                        </div>
                                        <div style={{ width: '100%', height: '20px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${porcentaje}%`,
                                                height: '100%',
                                                background: color,
                                                borderRadius: '4px',
                                                transition: 'width 0.5s ease'
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
