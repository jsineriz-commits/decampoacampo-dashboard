import { useState, useMemo, useEffect } from 'react'
import './styles/index.css'

const LOCAL_DATA_URL = '/gastos_reales.csv';

const CATEGORY_COLORS = {
    'Combustible': '#3b82f6',
    'Otros': '#8b5cf6',
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

const Logo = () => (
    <div className="logo-wrapper">
        <svg width="32" height="32" viewBox="0 0 100 100" className="logo-icon">
            <rect width="100" height="100" fill="#3b82f6" />
            <text x="10" y="45" fontFamily="Georgia, serif" fontSize="45" fill="white" fontWeight="bold">d</text>
            <text x="55" y="45" fontFamily="Georgia, serif" fontSize="45" fill="white" fontWeight="bold">C</text>
            <text x="32" y="85" fontFamily="Georgia, serif" fontSize="45" fill="white" fontWeight="bold">a</text>
            <text x="65" y="85" fontFamily="Georgia, serif" fontSize="45" fill="white" fontWeight="bold">C</text>
        </svg>
        <div className="logo-text">
            <span className="logo-title">DE CAMPO A CAMPO</span>
            <span className="logo-subtitle">Dashboard de Gastos</span>
        </div>
    </div>
);

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
    const [personaSeleccionada, setPersonaSeleccionada] = useState('')
    const [mesSeleccionado, setMesSeleccionado] = useState('')
    const [rangoMeses, setRangoMeses] = useState(6)
    const [mostrarTodasCategorias, setMostrarTodasCategorias] = useState(false)

    // Filtros de auditoría
    const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
    const [filtroFechaHasta, setFiltroFechaHasta] = useState('')
    const [filtroMetodoPago, setFiltroMetodoPago] = useState('')
    const [filtroCategoria, setFiltroCategoria] = useState('')

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

    const formatPeriodoCorto = (p) => {
        if (!p || p.length !== 6) return p;
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const mes = parseInt(p.slice(4), 10) - 1;
        return meses[mes];
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

                const periodos = [...new Set(parsed.map(r => r.periodo))].sort().reverse();
                if (periodos.length > 0 && !mesSeleccionado) {
                    setMesSeleccionado(periodos[0]);
                }

                setRawData(parsed);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error:', err);
                setLoading(false);
            });
    }, []);

    // Períodos disponibles
    const periodosDisponibles = useMemo(() => {
        return [...new Set(rawData.map(r => r.periodo))].sort().reverse();
    }, [rawData]);

    // Últimos N períodos para el gráfico
    const periodosGrafico = useMemo(() => {
        return periodosDisponibles.slice(0, rangoMeses).reverse();
    }, [periodosDisponibles, rangoMeses]);

    // Lista de usuarios únicos
    const usuariosUnicos = useMemo(() => {
        return [...new Set(rawData.map(r => r.usuario))].sort();
    }, [rawData]);

    // Métodos de pago únicos
    const metodosPago = useMemo(() => {
        return [...new Set(rawData.map(r => r.metodo))].filter(m => m).sort();
    }, [rawData]);

    // Categorías únicas
    const categoriasUnicas = useMemo(() => {
        return [...new Set(rawData.map(r => r.categoria))].sort();
    }, [rawData]);

    // Datos del mes seleccionado (con filtro de persona si está activo)
    const dataDelMes = useMemo(() => {
        let data = rawData.filter(r => r.periodo === mesSeleccionado);
        if (personaSeleccionada) {
            data = data.filter(r => r.usuario === personaSeleccionada);
        }
        return data;
    }, [rawData, mesSeleccionado, personaSeleccionada]);

    // Total del mes
    const totalMes = dataDelMes.reduce((acc, r) => acc + r.importe, 0);

    // Composición por categoría
    const composicion = useMemo(() => {
        const counts = dataDelMes.reduce((acc, r) => {
            acc[r.categoria] = (acc[r.categoria] || 0) + r.importe;
            return acc;
        }, {});
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [dataDelMes]);

    // Datos para el gráfico de barras (evolución por mes)
    const datosGrafico = useMemo(() => {
        return periodosGrafico.map(periodo => {
            let dataDelPeriodo = rawData.filter(r => r.periodo === periodo);
            if (personaSeleccionada) {
                dataDelPeriodo = dataDelPeriodo.filter(r => r.usuario === personaSeleccionada);
            }

            const porCategoria = dataDelPeriodo.reduce((acc, r) => {
                acc[r.categoria] = (acc[r.categoria] || 0) + r.importe;
                return acc;
            }, {});

            const total = dataDelPeriodo.reduce((acc, r) => acc + r.importe, 0);

            return {
                periodo,
                total,
                categorias: porCategoria
            };
        });
    }, [rawData, periodosGrafico, personaSeleccionada]);

    // Máximo para escalar el gráfico
    const maxGrafico = Math.max(...datosGrafico.map(d => d.total), 1);

    // Ranking de usuarios del mes
    const rankingUsuarios = useMemo(() => {
        const porUsuario = dataDelMes.reduce((acc, r) => {
            acc[r.usuario] = (acc[r.usuario] || 0) + r.importe;
            return acc;
        }, {});
        return Object.entries(porUsuario)
            .map(([nombre, total]) => ({ nombre, total }))
            .sort((a, b) => b.total - a.total);
    }, [dataDelMes]);

    // Transacciones del mes ordenadas por monto
    const transaccionesOrdenadas = useMemo(() => {
        return [...dataDelMes].sort((a, b) => b.importe - a.importe);
    }, [dataDelMes]);

    // ============ ALERTAS - Cálculo de desvíos ============
    const alertasDesvio = useMemo(() => {
        if (periodosDisponibles.length < 2) return [];

        const mesActual = mesSeleccionado;
        const ultimos3Periodos = periodosDisponibles.slice(1, 4); // Excluyendo el actual

        // Gastos por usuario en el mes actual
        const gastosActuales = rawData
            .filter(r => r.periodo === mesActual)
            .reduce((acc, r) => {
                acc[r.usuario] = (acc[r.usuario] || 0) + r.importe;
                return acc;
            }, {});

        // Promedio de últimos 3 meses por usuario
        const promedios = {};
        const historial = {};

        usuariosUnicos.forEach(usuario => {
            const gastosHist = ultimos3Periodos.map(p => {
                return rawData
                    .filter(r => r.periodo === p && r.usuario === usuario)
                    .reduce((acc, r) => acc + r.importe, 0);
            });

            const suma = gastosHist.reduce((a, b) => a + b, 0);
            const count = gastosHist.filter(g => g > 0).length;
            promedios[usuario] = count > 0 ? suma / count : 0;
            historial[usuario] = gastosHist;
        });

        // Calcular desvíos
        const desvios = Object.keys(gastosActuales)
            .filter(usuario => promedios[usuario] > 0)
            .map(usuario => {
                const actual = gastosActuales[usuario];
                const promedio = promedios[usuario];
                const desvioMonto = actual - promedio;
                const desvioPct = ((desvioMonto / promedio) * 100);

                // Obtener principales categorías del usuario este mes
                const categoriasMes = rawData
                    .filter(r => r.periodo === mesActual && r.usuario === usuario)
                    .reduce((acc, r) => {
                        acc[r.categoria] = (acc[r.categoria] || 0) + r.importe;
                        return acc;
                    }, {});

                const topCategorias = Object.entries(categoriasMes)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3);

                return {
                    usuario,
                    gastoActual: actual,
                    promedio,
                    desvioMonto,
                    desvioPct,
                    historial: historial[usuario],
                    topCategorias
                };
            })
            .filter(d => d.desvioMonto > 0) // Solo desvíos positivos
            .sort((a, b) => b.desvioMonto - a.desvioMonto);

        return desvios;
    }, [rawData, mesSeleccionado, periodosDisponibles, usuariosUnicos]);

    // ============ AUDITORÍA - Filtros avanzados ============
    const transaccionesFiltradas = useMemo(() => {
        let data = rawData;

        if (mesSeleccionado) {
            data = data.filter(r => r.periodo === mesSeleccionado);
        }

        if (personaSeleccionada || busqueda) {
            const filtro = personaSeleccionada || busqueda;
            data = data.filter(r =>
                r.usuario.toLowerCase().includes(filtro.toLowerCase())
            );
        }

        if (filtroMetodoPago) {
            data = data.filter(r => r.metodo === filtroMetodoPago);
        }

        if (filtroCategoria) {
            data = data.filter(r => r.categoria === filtroCategoria);
        }

        return data.sort((a, b) => b.importe - a.importe);
    }, [rawData, mesSeleccionado, personaSeleccionada, busqueda, filtroMetodoPago, filtroCategoria]);

    // Manejar selección de persona
    const handlePersonaClick = (nombre) => {
        if (personaSeleccionada === nombre) {
            setPersonaSeleccionada('');
            setBusqueda('');
        } else {
            setPersonaSeleccionada(nombre);
            setBusqueda(nombre);
        }
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <h2>Cargando datos...</h2>
            </div>
        );
    }

    return (
        <div className="app-container">
            {/* Header */}
            <header className="app-header">
                <div className="header-left">
                    <Logo />
                </div>
                <nav className="header-nav">
                    <button
                        className={`nav-tab ${activeTab === 'tablero' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tablero')}
                    >
                        📊 Tablero
                    </button>
                    <button
                        className={`nav-tab ${activeTab === 'alertas' ? 'active' : ''}`}
                        onClick={() => setActiveTab('alertas')}
                    >
                        ⚠️ Alertas
                    </button>
                    <button
                        className={`nav-tab ${activeTab === 'auditoria' ? 'active' : ''}`}
                        onClick={() => setActiveTab('auditoria')}
                    >
                        📋 Auditoría
                    </button>
                </nav>
            </header>

            <main className="main-content">
                {activeTab === 'tablero' && (
                    <div className="dashboard-grid">
                        {/* Columna izquierda */}
                        <div className="dashboard-left">
                            {/* Filtros */}
                            <div className="filters-row">
                                <div className="filter-group">
                                    <label>Período</label>
                                    <select value={mesSeleccionado} onChange={e => setMesSeleccionado(e.target.value)}>
                                        {periodosDisponibles.map(p => (
                                            <option key={p} value={p}>{formatPeriodo(p)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="filter-group search-group">
                                    <label>Buscar persona</label>
                                    <input
                                        type="text"
                                        placeholder="Escribí un nombre..."
                                        value={busqueda}
                                        onChange={e => {
                                            setBusqueda(e.target.value);
                                            const match = usuariosUnicos.find(u =>
                                                u.toLowerCase() === e.target.value.toLowerCase()
                                            );
                                            setPersonaSeleccionada(match || '');
                                        }}
                                        list="usuarios-list"
                                    />
                                    <datalist id="usuarios-list">
                                        {usuariosUnicos.map(u => <option key={u} value={u} />)}
                                    </datalist>
                                </div>
                                {personaSeleccionada && (
                                    <button className="clear-filter" onClick={() => {
                                        setPersonaSeleccionada('');
                                        setBusqueda('');
                                    }}>
                                        ✕ Limpiar filtro
                                    </button>
                                )}
                            </div>

                            {/* Gráfico de barras */}
                            <div className="chart-card">
                                <div className="chart-header">
                                    <h3>
                                        📈 Evolución de Gastos
                                        {personaSeleccionada && <span className="filter-badge">{personaSeleccionada}</span>}
                                    </h3>
                                    <div className="range-selector">
                                        {[3, 6, 9, 12].map(n => (
                                            <button
                                                key={n}
                                                className={rangoMeses === n ? 'active' : ''}
                                                onClick={() => setRangoMeses(n)}
                                            >
                                                {n}M
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="bar-chart">
                                    {datosGrafico.map((d, i) => (
                                        <div key={d.periodo} className="bar-column">
                                            <div
                                                className="bar-container"
                                                style={{ height: `${(d.total / maxGrafico) * 100}%` }}
                                            >
                                                {Object.entries(d.categorias).map(([cat, val]) => (
                                                    <div
                                                        key={cat}
                                                        className="bar-segment"
                                                        style={{
                                                            height: `${(val / d.total) * 100}%`,
                                                            background: CATEGORY_COLORS[cat] || '#6366f1'
                                                        }}
                                                        title={`${cat}: ${formatCurrency(val)}`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="bar-label">{formatPeriodoCorto(d.periodo)}</span>
                                            <span className="bar-value">{formatCurrency(d.total)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Indicadores */}
                            <div className="indicators-row">
                                <div className="indicator-card">
                                    <span className="indicator-icon">💰</span>
                                    <div className="indicator-info">
                                        <span className="indicator-label">Total {formatPeriodo(mesSeleccionado)}</span>
                                        <span className="indicator-value">{formatCurrency(totalMes)}</span>
                                    </div>
                                </div>
                                <div className="indicator-card">
                                    <span className="indicator-icon">📝</span>
                                    <div className="indicator-info">
                                        <span className="indicator-label">Transacciones</span>
                                        <span className="indicator-value">{dataDelMes.length}</span>
                                    </div>
                                </div>
                                <div className="indicator-card">
                                    <span className="indicator-icon">👥</span>
                                    <div className="indicator-info">
                                        <span className="indicator-label">Usuarios</span>
                                        <span className="indicator-value">{rankingUsuarios.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Columna derecha */}
                        <div className="dashboard-right">
                            {/* Composición */}
                            <div className="section-card">
                                <h3>📊 Composición por Categoría</h3>
                                <div className="composition-bar">
                                    {composicion.map(([cat, val]) => {
                                        const pct = ((val / totalMes) * 100).toFixed(1);
                                        return (
                                            <div
                                                key={cat}
                                                className="composition-segment"
                                                style={{
                                                    width: `${Math.max(pct, 1)}%`,
                                                    background: CATEGORY_COLORS[cat] || '#6366f1'
                                                }}
                                                title={`${cat}: ${pct}% (${formatCurrency(val)})`}
                                            >
                                                <span className="segment-tooltip">{pct}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="category-list">
                                    {(mostrarTodasCategorias ? composicion : composicion.slice(0, 5)).map(([cat, val]) => (
                                        <div key={cat} className="category-item">
                                            <div className="category-info">
                                                <span className="category-dot" style={{ background: CATEGORY_COLORS[cat] || '#6366f1' }} />
                                                <span>{cat}</span>
                                            </div>
                                            <span className="category-amount">{formatCurrency(val)}</span>
                                        </div>
                                    ))}
                                    {composicion.length > 5 && (
                                        <button
                                            className="show-more-btn"
                                            onClick={() => setMostrarTodasCategorias(!mostrarTodasCategorias)}
                                        >
                                            {mostrarTodasCategorias ? '▲ Mostrar menos' : `▼ Mostrar ${composicion.length - 5} más`}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Ranking o transacciones de persona */}
                            <div className="section-card">
                                <h3>{personaSeleccionada ? `💳 Consumos de ${personaSeleccionada}` : '🏆 Ranking de Gastos'}</h3>
                                <div className="ranking-list">
                                    {personaSeleccionada ? (
                                        transaccionesOrdenadas.slice(0, 10).map((t, i) => (
                                            <div key={i} className="ranking-item">
                                                <div className="ranking-info">
                                                    <span className="ranking-name">{t.comercio || 'Sin comercio'}</span>
                                                    <span className="ranking-meta">{t.fecha} • {t.categoria}</span>
                                                </div>
                                                <span className="ranking-amount">{formatCurrency(t.importe)}</span>
                                            </div>
                                        ))
                                    ) : (
                                        rankingUsuarios.slice(0, 10).map((u, i) => (
                                            <div
                                                key={i}
                                                className="ranking-item clickable"
                                                onClick={() => handlePersonaClick(u.nombre)}
                                            >
                                                <div className="ranking-position">{i + 1}</div>
                                                <span className="ranking-name">{u.nombre}</span>
                                                <span className="ranking-amount">{formatCurrency(u.total)}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'alertas' && (
                    <div className="alertas-container">
                        <div className="alertas-header">
                            <h2>⚠️ Alertas de Desvío</h2>
                            <p>Usuarios con mayor incremento vs promedio últimos 3 meses</p>
                        </div>

                        <div className="alertas-grid">
                            {alertasDesvio.slice(0, 10).map((a, i) => (
                                <div key={i} className="alerta-card">
                                    <div className="alerta-header">
                                        <span className="alerta-rank">#{i + 1}</span>
                                        <span className="alerta-name">{a.usuario}</span>
                                        <span className={`alerta-badge ${a.desvioPct > 50 ? 'danger' : 'warning'}`}>
                                            +{a.desvioPct.toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="alerta-stats">
                                        <div className="alerta-stat">
                                            <span className="stat-label">Gasto actual</span>
                                            <span className="stat-value">{formatCurrency(a.gastoActual)}</span>
                                        </div>
                                        <div className="alerta-stat">
                                            <span className="stat-label">Promedio 3M</span>
                                            <span className="stat-value">{formatCurrency(a.promedio)}</span>
                                        </div>
                                        <div className="alerta-stat highlight">
                                            <span className="stat-label">Desvío</span>
                                            <span className="stat-value">+{formatCurrency(a.desvioMonto)}</span>
                                        </div>
                                    </div>
                                    <div className="alerta-categories">
                                        <span className="cat-title">Principales gastos:</span>
                                        {a.topCategorias.map(([cat, val]) => (
                                            <span key={cat} className="cat-tag" style={{ borderColor: CATEGORY_COLORS[cat] }}>
                                                {cat}: {formatCurrency(val)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {alertasDesvio.length === 0 && (
                            <div className="empty-state">
                                <p>No hay alertas de desvío para mostrar</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'auditoria' && (
                    <div className="auditoria-container">
                        <div className="audit-filters">
                            <div className="filter-group">
                                <label>Período</label>
                                <select value={mesSeleccionado} onChange={e => setMesSeleccionado(e.target.value)}>
                                    <option value="">Todos</option>
                                    {periodosDisponibles.map(p => (
                                        <option key={p} value={p}>{formatPeriodo(p)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>Persona</label>
                                <input
                                    type="text"
                                    placeholder="Filtrar por persona..."
                                    value={busqueda}
                                    onChange={e => setBusqueda(e.target.value)}
                                    list="usuarios-audit"
                                />
                                <datalist id="usuarios-audit">
                                    {usuariosUnicos.map(u => <option key={u} value={u} />)}
                                </datalist>
                            </div>
                            <div className="filter-group">
                                <label>Método de Pago</label>
                                <select value={filtroMetodoPago} onChange={e => setFiltroMetodoPago(e.target.value)}>
                                    <option value="">Todos</option>
                                    {metodosPago.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>Categoría</label>
                                <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
                                    <option value="">Todas</option>
                                    {categoriasUnicas.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="audit-summary">
                            <span>{transaccionesFiltradas.length} transacciones</span>
                            <span>Total: {formatCurrency(transaccionesFiltradas.reduce((a, r) => a + r.importe, 0))}</span>
                        </div>

                        <div className="audit-table-container">
                            <table className="audit-table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Usuario</th>
                                        <th>Comercio</th>
                                        <th>Categoría</th>
                                        <th>Método</th>
                                        <th className="amount-col">Importe</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transaccionesFiltradas.slice(0, 100).map((t, i) => (
                                        <tr key={i}>
                                            <td>{t.fecha}</td>
                                            <td>{t.usuario}</td>
                                            <td>{t.comercio || '-'}</td>
                                            <td>
                                                <span className="cat-pill" style={{ background: CATEGORY_COLORS[t.categoria] || '#6366f1' }}>
                                                    {t.categoria}
                                                </span>
                                            </td>
                                            <td>{t.metodo}</td>
                                            <td className="amount-col">{formatCurrency(t.importe)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

export default App
