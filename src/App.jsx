import { useState, useMemo, useEffect } from 'react'

const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTe01FxUFIrW5g5FGQnFBHpxg3gjgg_zmTL0fkSX_iVFgzTiw3LmLd7VTQmx16RmuxSXZR6uoryXvP9/pub?output=csv';

const CATEGORY_COLORS = {
    'Combustible': '#3b82f6',
    'Otros': '#ef4444',
    'Obra Social': '#10b981',
    'Service / Reparaciones Auto': '#f59e0b',
    'Comidas': '#8b5cf6',
    'Peajes': '#64748b',
    'Hoteleria': '#ec4899',
    'Servicios': '#06b6d4',
    'Monotributo/Autonomos': '#14b8a6'
};

// CSV Parser robusto que maneja campos con comillas y comas internas
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

// Función para parsear montos como "1,120,580" o "30,000"
function parseImporte(str) {
    if (!str) return 0;
    // Eliminar comillas y luego eliminar todas las comas
    const clean = str.replace(/"/g, '').replace(/,/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
}

function App() {
    const [rawData, setRawData] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('tablero')
    const [busqueda, setBusqueda] = useState('')
    const [mesSeleccionado, setMesSeleccionado] = useState('202506')

    const formatCurrency = (val) => new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0
    }).format(val);

    useEffect(() => {
        fetch(GOOGLE_SHEET_URL)
            .then(res => res.text())
            .then(csv => {
                const lines = csv.split(/\r?\n/);
                // Saltar el header
                const dataLines = lines.slice(1).filter(line => line.trim());

                const parsed = dataLines.map(line => {
                    const cols = parseCSVLine(line);

                    // Columnas según el CSV:
                    // 0: ID Transaccion
                    // 1: Fecha transaccion
                    // 2: Fecha confirmacion
                    // 3: Usuario
                    // 4: Comercio
                    // 5: Importe Total (con formato "30,000")
                    // 6: Metodo de pago
                    // 7: Estado transaccion
                    // 8: Usuario normalizado
                    // 9: Categoria normalizada
                    // 10: Periodo normalizado

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

                console.log('Datos parseados:', parsed.length, 'registros');
                console.log('Ejemplo:', parsed[0]);
                setRawData(parsed);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error:', err);
                setLoading(false);
            });
    }, []);

    // Periodos disponibles
    const periodosDisponibles = useMemo(() => {
        const periodos = [...new Set(rawData.map(r => r.periodo))].sort().reverse();
        return periodos;
    }, [rawData]);

    // Datos filtrados por período
    const dataDelMes = useMemo(() => {
        return rawData.filter(r => r.periodo === mesSeleccionado);
    }, [rawData, mesSeleccionado]);

    // Datos filtrados por búsqueda
    const dataFiltrada = useMemo(() => {
        if (!busqueda) return dataDelMes;
        return dataDelMes.filter(r =>
            r.usuario.toLowerCase().includes(busqueda.toLowerCase())
        );
    }, [dataDelMes, busqueda]);

    // Total del mes
    const totalMes = dataFiltrada.reduce((acc, r) => acc + r.importe, 0);

    // Composición por categoría
    const composicion = useMemo(() => {
        const counts = dataFiltrada.reduce((acc, r) => {
            acc[r.categoria] = (acc[r.categoria] || 0) + r.importe;
            return acc;
        }, {});
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [dataFiltrada]);

    // Ranking de usuarios
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
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ color: '#1e3a8a' }}>Cargando datos reales...</h2>
                    <p style={{ color: '#64748b' }}>Conectando con Google Sheets</p>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container" style={{ background: '#f8fafc' }}>
            <main className="main-content">

                {activeTab === 'tablero' && (
                    <>
                        {/* Filtros */}
                        <section className="hero-card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '150px' }}>
                                    <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>PERÍODO</label>
                                    <select
                                        className="filter-select"
                                        style={{ width: '100%' }}
                                        value={mesSeleccionado}
                                        onChange={e => setMesSeleccionado(e.target.value)}
                                    >
                                        {periodosDisponibles.map(p => (
                                            <option key={p} value={p}>{p.slice(0, 4)}/{p.slice(4)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flex: 2, minWidth: '200px' }}>
                                    <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>BUSCAR PERSONA</label>
                                    <input
                                        className="filter-input"
                                        style={{ width: '100%' }}
                                        placeholder="Escribí un nombre..."
                                        value={busqueda}
                                        onChange={e => setBusqueda(e.target.value)}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Indicadores principales */}
                        <div className="indicator-grid">
                            <div className="indicator-card">
                                <div className="indicator-header">
                                    <span className="indicator-title">Total Confirmado</span>
                                </div>
                                <div className="indicator-value">{formatCurrency(totalMes)}</div>
                                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                                    {dataFiltrada.length} transacciones
                                </div>
                            </div>

                            <div className="indicator-card purple-border">
                                <div className="indicator-header">
                                    <span className="indicator-title">Usuarios Activos</span>
                                </div>
                                <div className="indicator-value">{rankingUsuarios.length}</div>
                                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                                    en el período seleccionado
                                </div>
                            </div>
                        </div>

                        {/* Composición por Categoría */}
                        <section className="hero-card">
                            <h3 style={{ fontSize: '0.9rem', color: '#1e3a8a', fontWeight: '700', marginBottom: '1rem' }}>
                                COMPOSICIÓN POR CATEGORÍA
                            </h3>
                            <div className="comp-bar">
                                {composicion.map(([cat, val]) => (
                                    <div
                                        key={cat}
                                        className="comp-segment"
                                        style={{
                                            width: `${(val / totalMes) * 100}%`,
                                            background: CATEGORY_COLORS[cat] || '#64748b'
                                        }}
                                        title={`${cat}: ${formatCurrency(val)}`}
                                    />
                                ))}
                            </div>
                            <div style={{ marginTop: '1.5rem' }}>
                                {composicion.map(([cat, val]) => (
                                    <div key={cat} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px 0',
                                        borderBottom: '1px solid #f1f5f9'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '12px',
                                                height: '12px',
                                                borderRadius: '3px',
                                                background: CATEGORY_COLORS[cat] || '#64748b'
                                            }} />
                                            <span style={{ fontWeight: '600' }}>{cat}</span>
                                        </div>
                                        <span style={{ fontWeight: '800' }}>{formatCurrency(val)}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Ranking de Usuarios */}
                        <section className="hero-card" style={{ marginTop: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.9rem', color: '#1e3a8a', fontWeight: '700', marginBottom: '1rem' }}>
                                RANKING DE GASTOS
                            </h3>
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {rankingUsuarios.map((u, i) => (
                                    <div key={i} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px 0',
                                        borderBottom: '1px solid #f1f5f9'
                                    }}>
                                        <div>
                                            <span style={{
                                                display: 'inline-block',
                                                width: '28px',
                                                fontWeight: '800',
                                                color: i < 3 ? '#1e3a8a' : '#94a3b8'
                                            }}>
                                                #{i + 1}
                                            </span>
                                            <span style={{ fontWeight: '700' }}>{u.nombre}</span>
                                        </div>
                                        <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>{formatCurrency(u.total)}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )}

                {activeTab === 'alertas' && (
                    <section className="hero-card">
                        <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1rem' }}>Alertas de Desvío</h2>
                        <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '12px', color: '#991b1b', fontSize: '0.85rem', fontWeight: '700', marginBottom: '1.5rem' }}>
                            ⚠️ RANKING MAYORES GASTOS
                        </div>
                        {rankingUsuarios.slice(0, 5).map((u, i) => (
                            <div key={i} className="audit-item" style={{ marginBottom: '10px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                <div>
                                    <div style={{ fontWeight: '800' }}>#{i + 1} {u.nombre}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>{formatCurrency(u.total)}</div>
                                </div>
                            </div>
                        ))}
                    </section>
                )}

                {activeTab === 'auditoria' && (
                    <section className="hero-card" style={{ padding: 0 }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Auditoría de Transacciones</h2>
                            <p style={{ color: '#64748b', fontSize: '0.8rem' }}>{dataFiltrada.length} transacciones en {mesSeleccionado}</p>
                        </div>
                        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            {dataFiltrada.map((r, i) => (
                                <div key={i} className="audit-item">
                                    <div className="audit-info">
                                        <h4>{r.comercio || 'Sin comercio'}</h4>
                                        <div className="audit-meta">{r.fecha} • {r.usuario}</div>
                                        <div style={{ marginTop: '4px' }}>
                                            <span className="tag-card">{r.metodo}</span>
                                            <span className="tag-card" style={{ marginLeft: '4px' }}>{r.categoria}</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>{formatCurrency(r.importe)}</div>
                                        <div style={{ color: '#22c55e', fontSize: '0.7rem', fontWeight: '700' }}>CONFIRMADA</div>
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
