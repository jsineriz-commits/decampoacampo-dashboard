import { useState, useMemo, useEffect } from 'react'
import './styles/index.css'

const LOCAL_DATA_URL = '/gastos_reales.csv';

const CATEGORY_COLORS = {
    'Combustible': '#3b82f6',
    'Otros': '#a855f7',
    'Obra Social': '#10b981',
    'Service / Reparaciones Auto': '#f59e0b',
    'Comidas': '#ec4899',
    'Peajes': '#64748b',
    'Hoteleria': '#06b6d4',
    'Servicios': '#14b8a6',
    'Monotributo/Autonomos': '#f97316',
    'Alimentos': '#84cc16',
    'Impuestos': '#ef4444',
    'Reparaciones': '#eab308'
};

// CSV Parser robusto
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

function parseImporte(str) {
    if (!str) return 0;
    const clean = str.replace(/"/g, '').replace(/,/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
}

function App() {
    const [rawData, setRawData] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('tablero')
    const [busqueda, setBusqueda] = useState('')
    const [mesSeleccionado, setMesSeleccionado] = useState('')

    const formatCurrency = (val) => new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0
    }).format(val);

    const formatPeriodo = (p) => {
        if (!p || p.length !== 6) return p;
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const mes = parseInt(p.slice(4), 10) - 1;
        return `${meses[mes]} ${p.slice(0, 4)}`;
    };

    useEffect(() => {
        fetch(LOCAL_DATA_URL)
            .then(res => res.text())
            .then(csv => {
                const lines = csv.split(/\r?\n/);
                const dataLines = lines.slice(1).filter(line => line.trim());

                const parsed = dataLines.map(line => {
                    const cols = parseCSVLine(line);
                    const usuario = cols[8] || cols[3] || 'Sin Usuario';
                    const importe = parseImporte(cols[5]);
                    const estado = cols[7] || '';
                    const categoria = cols[9] || 'Otros';
                    const periodo = cols[10] || '';

                    return {
                        id: cols[0],
                        fecha: cols[1],
                        fechaConf: cols[2],
                        usuarioOriginal: cols[3],
                        usuario: usuario,
                        comercio: cols[4] || '',
                        importe: importe,
                        metodo: cols[6] || '',
                        estado: estado,
                        categoria: categoria,
                        periodo: periodo
                    };
                }).filter(r => r.estado === 'CONFIRMADA' && r.usuario);

                // Obtener período más reciente automáticamente
                const periodos = [...new Set(parsed.map(r => r.periodo))].sort().reverse();
                if (periodos.length > 0 && !mesSeleccionado) {
                    setMesSeleccionado(periodos[0]);
                }

                console.log('Datos cargados:', parsed.length, 'registros confirmados');
                setRawData(parsed);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error cargando datos:', err);
                setLoading(false);
            });
    }, []);

    const periodosDisponibles = useMemo(() => {
        return [...new Set(rawData.map(r => r.periodo))].sort().reverse();
    }, [rawData]);

    const dataDelMes = useMemo(() => {
        return rawData.filter(r => r.periodo === mesSeleccionado);
    }, [rawData, mesSeleccionado]);

    const dataFiltrada = useMemo(() => {
        if (!busqueda) return dataDelMes;
        return dataDelMes.filter(r =>
            r.usuario.toLowerCase().includes(busqueda.toLowerCase())
        );
    }, [dataDelMes, busqueda]);

    const totalMes = dataFiltrada.reduce((acc, r) => acc + r.importe, 0);

    const composicion = useMemo(() => {
        const counts = dataFiltrada.reduce((acc, r) => {
            acc[r.categoria] = (acc[r.categoria] || 0) + r.importe;
            return acc;
        }, {});
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [dataFiltrada]);

    const rankingUsuarios = useMemo(() => {
        const porUsuario = dataFiltrada.reduce((acc, r) => {
            acc[r.usuario] = (acc[r.usuario] || 0) + r.importe;
            return acc;
        }, {});
        return Object.entries(porUsuario)
            .map(([nombre, total]) => ({ nombre, total }))
            .sort((a, b) => b.total - a.total);
    }, [dataFiltrada]);

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-content">
                    <div className="loading-spinner"></div>
                    <h2>Cargando datos...</h2>
                    <p>Sincronizando con Google Sheets</p>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            <header className="app-header">
                <h1 className="logo">DE CAMPO A CAMPO</h1>
                <p className="subtitle">Dashboard de Gastos</p>
            </header>

            <main className="main-content">
                {activeTab === 'tablero' && (
                    <>
                        {/* Filtros */}
                        <div className="filters-card">
                            <div className="filter-group">
                                <label>Período</label>
                                <select
                                    value={mesSeleccionado}
                                    onChange={e => setMesSeleccionado(e.target.value)}
                                >
                                    {periodosDisponibles.map(p => (
                                        <option key={p} value={p}>{formatPeriodo(p)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-group search">
                                <label>Buscar persona</label>
                                <input
                                    type="text"
                                    placeholder="Escribí un nombre..."
                                    value={busqueda}
                                    onChange={e => setBusqueda(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Indicadores */}
                        <div className="indicators-grid">
                            <div className="indicator-card primary">
                                <div className="indicator-icon">💰</div>
                                <div className="indicator-content">
                                    <span className="indicator-label">Total Confirmado</span>
                                    <span className="indicator-value">{formatCurrency(totalMes)}</span>
                                    <span className="indicator-detail">{dataFiltrada.length} transacciones</span>
                                </div>
                            </div>
                            <div className="indicator-card secondary">
                                <div className="indicator-icon">👥</div>
                                <div className="indicator-content">
                                    <span className="indicator-label">Usuarios Activos</span>
                                    <span className="indicator-value">{rankingUsuarios.length}</span>
                                    <span className="indicator-detail">Personas con gastos</span>
                                </div>
                            </div>
                        </div>

                        {/* Composición por Categoría */}
                        <div className="section-card">
                            <h3 className="section-title">📊 Composición por Categoría</h3>
                            <div className="composition-bar">
                                {composicion.map(([cat, val]) => (
                                    <div
                                        key={cat}
                                        className="composition-segment"
                                        style={{
                                            width: `${Math.max((val / totalMes) * 100, 2)}%`,
                                            background: CATEGORY_COLORS[cat] || '#6366f1'
                                        }}
                                        title={`${cat}: ${formatCurrency(val)}`}
                                    />
                                ))}
                            </div>
                            <div className="category-list">
                                {composicion.map(([cat, val]) => (
                                    <div key={cat} className="category-item">
                                        <div className="category-info">
                                            <span
                                                className="category-dot"
                                                style={{ background: CATEGORY_COLORS[cat] || '#6366f1' }}
                                            />
                                            <span className="category-name">{cat}</span>
                                        </div>
                                        <span className="category-amount">{formatCurrency(val)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Ranking de Usuarios */}
                        <div className="section-card">
                            <h3 className="section-title">🏆 Ranking de Gastos</h3>
                            <div className="ranking-list">
                                {rankingUsuarios.slice(0, 10).map((u, i) => (
                                    <div key={i} className={`ranking-item ${i < 3 ? 'top-three' : ''}`}>
                                        <div className="ranking-position">
                                            {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                                        </div>
                                        <div className="ranking-name">{u.nombre}</div>
                                        <div className="ranking-amount">{formatCurrency(u.total)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'alertas' && (
                    <div className="section-card">
                        <h2 className="section-title">⚠️ Alertas de Gastos Elevados</h2>
                        <p className="alert-description">Top 5 usuarios con mayor gasto en {formatPeriodo(mesSeleccionado)}</p>
                        <div className="alert-list">
                            {rankingUsuarios.slice(0, 5).map((u, i) => (
                                <div key={i} className="alert-item">
                                    <div className="alert-rank">#{i + 1}</div>
                                    <div className="alert-info">
                                        <span className="alert-name">{u.nombre}</span>
                                        <span className="alert-amount">{formatCurrency(u.total)}</span>
                                    </div>
                                    <div className="alert-badge">Revisar</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'auditoria' && (
                    <div className="section-card audit-section">
                        <div className="audit-header">
                            <h2 className="section-title">📋 Auditoría de Transacciones</h2>
                            <span className="audit-count">{dataFiltrada.length} registros</span>
                        </div>
                        <div className="audit-list">
                            {dataFiltrada.slice(0, 50).map((r, i) => (
                                <div key={i} className="audit-item">
                                    <div className="audit-main">
                                        <span className="audit-comercio">{r.comercio || 'Sin comercio'}</span>
                                        <span className="audit-amount">{formatCurrency(r.importe)}</span>
                                    </div>
                                    <div className="audit-details">
                                        <span>{r.fecha}</span>
                                        <span>•</span>
                                        <span>{r.usuario}</span>
                                        <span>•</span>
                                        <span className="audit-tag">{r.categoria}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <nav className="bottom-nav">
                <button
                    className={`nav-btn ${activeTab === 'tablero' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tablero')}
                >
                    <span className="nav-icon">📊</span>
                    <span>Tablero</span>
                </button>
                <button
                    className={`nav-btn ${activeTab === 'alertas' ? 'active' : ''}`}
                    onClick={() => setActiveTab('alertas')}
                >
                    <span className="nav-icon">🔔</span>
                    <span>Alertas</span>
                </button>
                <button
                    className={`nav-btn ${activeTab === 'auditoria' ? 'active' : ''}`}
                    onClick={() => setActiveTab('auditoria')}
                >
                    <span className="nav-icon">📋</span>
                    <span>Auditoría</span>
                </button>
            </nav>
        </div>
    )
}

export default App
