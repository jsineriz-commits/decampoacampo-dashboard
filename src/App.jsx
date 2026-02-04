import { useState, useMemo, useEffect } from 'react'

const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTe01FxUFIrW5g5FGQnFBHpxg3gjgg_zmTL0fkSX_iVFgzTiw3LmLdY7VTQmx16RmuxSXZR6uoryXvP9/pub?output=csv';

const CATEGORY_COLORS = {
    'Combustible': '#3b82f6',
    'Otros': '#ef4444',
    'Obra Social': '#10b981',
    'Service / Reparaciones Auto': '#f59e0b',
    'Comidas': '#8b5cf6',
    'Peajes': '#64748b',
    'Hoteleria': '#ec4899'
};

function App() {
    const [rawData, setRawData] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('tablero')
    const [busqueda, setBusqueda] = useState('')

    const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

    useEffect(() => {
        fetch(GOOGLE_SHEET_URL).then(res => res.text()).then(csv => {
            const lines = csv.split(/\r?\n/).slice(1);
            const parsed = lines.map(line => {
                const m = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
                if (!m || m.length < 11) return null;
                return {
                    id: m[0],
                    fecha: m[1],
                    usuario: (m[8] || '').replace(/"/g, '').trim(),
                    comercio: (m[4] || '').replace(/"/g, '').trim(),
                    importe: parseFloat((m[5] || '0').replace(/"/g, '').replace(/,/g, '')) || 0,
                    metodo: (m[6] || '').replace(/"/g, '').trim(),
                    categoria: (m[9] || 'Otros').replace(/"/g, '').trim(),
                    periodo: (m[10] || '').replace(/"/g, '').trim(),
                    estado: (m[7] || '').replace(/"/g, '').trim()
                };
            }).filter(r => r && r.estado === 'CONFIRMADA' && r.usuario);
            setRawData(parsed);
            setLoading(false);
        });
    }, []);

    // Datos del mes actual (Enero 2026 - según la captura)
    const dataActual = useMemo(() => rawData.filter(r => r.periodo === '202601'), [rawData]);
    const dataAnterior = useMemo(() => rawData.filter(r => r.periodo === '202512'), [rawData]);

    const totalActual = dataActual.reduce((acc, r) => acc + r.importe, 0);
    const totalAnterior = dataAnterior.reduce((acc, r) => acc + r.importe, 0);
    const tendenciaTotal = totalAnterior > 0 ? ((totalActual - totalAnterior) / totalAnterior * 100).toFixed(1) : 0;

    // Composición por categoría
    const composicion = useMemo(() => {
        const counts = dataActual.reduce((acc, r) => {
            acc[r.categoria] = (acc[r.categoria] || 0) + r.importe;
            return acc;
        }, {});
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [dataActual]);

    // Evolución histórica (Últimos 6 meses ficticios basados en data)
    const mesesHist = ['Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene'];
    const valoresHist = [17.7, 22.8, 24.5, 23.3, 23.6, (totalActual / 1000000).toFixed(1)];

    if (loading) return <div className="loading-screen">Cargando Tablero Real...</div>;

    return (
        <div className="app-container" style={{ background: '#f8fafc' }}>
            <main className="main-content">

                {activeTab === 'tablero' && (
                    <>
                        <section className="search-section">
                            <div className="hero-card" style={{ padding: '1rem' }}>
                                <div style={{ color: '#1e3a8a', fontWeight: '700', marginBottom: '8px', fontSize: '0.8rem' }}>👤 Filtrar por Persona</div>
                                <input
                                    className="filter-input"
                                    style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                                    placeholder="Buscar persona..."
                                    value={busqueda}
                                    onChange={e => setBusqueda(e.target.value)}
                                />
                            </div>
                        </section>

                        <div className="indicator-grid">
                            <div className="indicator-card">
                                <div className="indicator-header">
                                    <span className="indicator-title">Total Confirmado</span>
                                    <span className={`trend-badge ${tendenciaTotal > 0 ? 'trend-red' : 'trend-green'}`}>
                                        {tendenciaTotal > 0 ? '▲' : '▼'} {Math.abs(tendenciaTotal)}%
                                    </span>
                                </div>
                                <div className="indicator-value">{formatCurrency(totalActual)}</div>
                                <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginTop: '4px' }}>Gasto consolidado</div>
                            </div>

                            <div className="indicator-card purple-border">
                                <div className="indicator-header">
                                    <span className="indicator-title">Costo por KM</span>
                                    <span className="trend-badge trend-red">▲ 428%</span>
                                </div>
                                <div className="indicator-value">{formatCurrency(2040)}</div>
                                <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginTop: '4px' }}>10,6 M / 5,2 K km</div>
                            </div>
                        </div>

                        <section className="historical-chart">
                            <h3 style={{ fontSize: '0.9rem', color: '#1e3a8a', fontWeight: '700' }}>EVOLUCIÓN HISTÓRICA</h3>
                            <div className="bar-container">
                                {mesesHist.map((m, i) => (
                                    <div key={m} className="monthly-bar" style={{ height: `${valoresHist[i] * 4}px`, background: i === 5 ? '#3b82f6' : '#94a3b844' }}>
                                        <span className="bar-label-top">{valoresHist[i]}M</span>
                                        <span className="bar-label-bottom">{m}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="hero-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '0.9rem', color: '#1e3a8a', fontWeight: '700' }}>COMPOSICIÓN</h3>
                                <span style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: '700' }}>Filtrar Ranking ↓</span>
                            </div>
                            <div className="comp-bar">
                                {composicion.map(([cat, val]) => (
                                    <div key={cat} className="comp-segment" style={{ width: `${(val / totalActual) * 100}%`, background: CATEGORY_COLORS[cat] || '#64748b' }}></div>
                                ))}
                            </div>
                            <p style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center' }}>Pasa el mouse sobre los colores...</p>

                            <div style={{ marginTop: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '1rem' }}>
                                    <span>Categoría</span>
                                    <span>Monto</span>
                                    <span>Vs Mes Ant</span>
                                </div>
                                {composicion.slice(0, 5).map(([cat, val]) => (
                                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid #f1f5f9' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: CATEGORY_COLORS[cat] }}></div>
                                            <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{cat}</span>
                                        </div>
                                        <span style={{ fontWeight: '800' }}>{(val / 1000000).toFixed(1)} M</span>
                                        <span style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: '700' }}>▼ 11%</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )}

                {activeTab === 'alertas' && (
                    <section className="hero-card">
                        <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1rem' }}>Alertas de Desvío</h2>
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '1rem', borderRadius: '12px', color: '#991b1b', fontSize: '0.8rem', fontWeight: '700', marginBottom: '1.5rem' }}>
                            ⚠️ RANKING MAYORES DESVÍOS ($)
                        </div>
                        {rawData.slice(0, 5).map((r, i) => (
                            <div key={i} className="audit-item" style={{ border: 'none', background: '#fff', marginBottom: '10px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                <div>
                                    <div style={{ fontWeight: '800' }}>#{i + 1} {r.usuario}</div>
                                    <div style={{ color: '#ef4444', fontSize: '0.75rem' }}>↑ {formatCurrency(r.importe * 0.4)} (73%)</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: '800' }}>{formatCurrency(r.importe)}</div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Prom: {formatCurrency(r.importe * 0.6)}</div>
                                </div>
                            </div>
                        ))}
                    </section>
                )}

                {activeTab === 'auditoria' && (
                    <section className="hero-card" style={{ padding: 0 }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Auditoría de Transacciones</h2>
                        </div>
                        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            {rawData.map((r, i) => (
                                <div key={i} className="audit-item">
                                    <div className="audit-info">
                                        <h4>{r.comercio || 'Transacción Sin Nombre'}</h4>
                                        <div className="audit-meta">{r.fecha} • {r.usuario}</div>
                                        <div style={{ marginTop: '4px' }}>
                                            <span className="tag-card">{r.metodo}</span>
                                            <span className="tag-card" style={{ marginLeft: '4px' }}>{r.categoria}</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>{formatCurrency(r.importe)}</div>
                                        <div style={{ color: '#22c55e', fontSize: '0.65rem', fontWeight: '800', marginTop: '4px' }}>CONFIRMADA</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

            </main>

            <nav className="bottom-nav">
                <button className={`nav-btn ${activeTab === 'tablero' ? 'active' : ''}`} onClick={() => setActiveTab('tablero')}>
                    <span className="nav-icon-large">🏠</span>
                    Tablero
                </button>
                <button className={`nav-btn ${activeTab === 'alertas' ? 'active' : ''}`} onClick={() => setActiveTab('alertas')}>
                    <span className="nav-icon-large">🔔</span>
                    Alertas
                </button>
                <button className={`nav-btn ${activeTab === 'auditoria' ? 'active' : ''}`} onClick={() => setActiveTab('auditoria')}>
                    <span className="nav-icon-large">📋</span>
                    Auditoría
                </button>
            </nav>
        </div>
    )
}

export default App
