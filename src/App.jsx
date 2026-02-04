import { useState, useMemo } from 'react'
import { comerciales, zonas, tiposGasto, calcularTotales, formatCurrency } from './data/comerciales'

function App() {
    const [filtroZona, setFiltroZona] = useState('Todas')
    const [filtroTipo, setFiltroTipo] = useState('todos')
    const [busqueda, setBusqueda] = useState('')

    // Filtrar comerciales
    const comercialesFiltrados = useMemo(() => {
        return comerciales.filter(c => {
            const coincideZona = filtroZona === 'Todas' || c.zona === filtroZona
            const coincideBusqueda = c.nombre.toLowerCase().includes(busqueda.toLowerCase())
            return coincideZona && coincideBusqueda
        })
    }, [filtroZona, busqueda])

    // Calcular totales
    const totales = useMemo(() => calcularTotales(comercialesFiltrados), [comercialesFiltrados])

    return (
        <div className="app-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="logo">
                    <div className="logo-icon">🐄</div>
                    <div>
                        <div className="logo-text">DeCampoACampo</div>
                        <div className="logo-subtext">Mercado Ganadero</div>
                    </div>
                </div>

                <ul className="nav-menu">
                    <li className="nav-item active">
                        <span className="nav-icon">📊</span>
                        <span>Dashboard</span>
                    </li>
                    <li className="nav-item">
                        <span className="nav-icon">👥</span>
                        <span>Comerciales</span>
                    </li>
                    <li className="nav-item">
                        <span className="nav-icon">📋</span>
                        <span>Reportes</span>
                    </li>
                    <li className="nav-item">
                        <span className="nav-icon">⚙️</span>
                        <span>Configuración</span>
                    </li>
                </ul>
            </aside>

            {/* Contenido Principal */}
            <main className="main-content">
                {/* Header */}
                <header className="page-header">
                    <h1 className="page-title">Dashboard de Gastos</h1>
                    <p className="page-subtitle">
                        Visualiza los costos y gastos de los asociados comerciales
                    </p>
                </header>

                {/* Tarjetas de Estadísticas */}
                <section className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-header">
                            <div className="stat-icon total">💰</div>
                        </div>
                        <div className="stat-title">Total Gastos</div>
                        <div className="stat-value">{formatCurrency(totales.total)}</div>
                        <div className="stat-change positive">
                            <span>↑</span> {comercialesFiltrados.length} comerciales
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <div className="stat-icon fuel">⛽</div>
                        </div>
                        <div className="stat-title">Combustible</div>
                        <div className="stat-value">{formatCurrency(totales.combustible)}</div>
                        <div className="stat-change positive">
                            <span>↑</span> 12% vs mes anterior
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <div className="stat-icon food">🍽️</div>
                        </div>
                        <div className="stat-title">Comidas</div>
                        <div className="stat-value">{formatCurrency(totales.comidas)}</div>
                        <div className="stat-change negative">
                            <span>↓</span> 3% vs mes anterior
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <div className="stat-icon hotel">🏨</div>
                        </div>
                        <div className="stat-title">Hoteles</div>
                        <div className="stat-value">{formatCurrency(totales.hoteles)}</div>
                        <div className="stat-change positive">
                            <span>↑</span> 8% vs mes anterior
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <div className="stat-icon health">🏥</div>
                        </div>
                        <div className="stat-title">Obra Social</div>
                        <div className="stat-value">{formatCurrency(totales.obraSocial)}</div>
                        <div className="stat-change positive">
                            <span>—</span> Sin cambios
                        </div>
                    </div>
                </section>

                {/* Filtros */}
                <section className="filters-section">
                    <div className="filters-title">Filtros y Búsqueda</div>
                    <div className="filters-grid">
                        <div className="filter-group">
                            <label className="filter-label">Buscar comercial</label>
                            <input
                                type="text"
                                className="filter-input"
                                placeholder="Escribe un nombre..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                        <div className="filter-group">
                            <label className="filter-label">Zona Geográfica</label>
                            <select
                                className="filter-select"
                                value={filtroZona}
                                onChange={(e) => setFiltroZona(e.target.value)}
                            >
                                {zonas.map(zona => (
                                    <option key={zona} value={zona}>{zona}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                {/* Resumen Visual por Zonas */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>

                    {/* Tabla de Comerciales */}
                    <section className="table-section" style={{ margin: 0 }}>
                        <div className="table-header">
                            <h2 className="table-title">Asociados en {filtroZona}</h2>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Zona</th>
                                        <th>Total Mes</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comercialesFiltrados.map(comercial => (
                                        <tr key={comercial.id}>
                                            <td><strong>{comercial.nombre}</strong></td>
                                            <td><span className="zone-badge">{comercial.zona}</span></td>
                                            <td className="amount">{formatCurrency(comercial.totalMes)}</td>
                                            <td>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    background: comercial.totalMes > 300000 ? '#fef2f2' : '#f0fdf4',
                                                    color: comercial.totalMes > 300000 ? '#991b1b' : '#166534'
                                                }}>
                                                    {comercial.totalMes > 300000 ? 'Revisar' : 'Aprobado'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Gráfico de Gastos por Zona (CSS puro) */}
                    <section className="table-section" style={{ padding: '1.5rem', margin: 0 }}>
                        <h2 className="table-title" style={{ marginBottom: '1.5rem' }}>Gasto Acumulado por Zona</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            {zonas.filter(z => z !== 'Todas').map(zona => {
                                const totalZona = comerciales
                                    .filter(c => c.zona === zona)
                                    .reduce((acc, curr) => acc + curr.totalMes, 0);
                                const porcentaje = Math.min((totalZona / 500000) * 100, 100);

                                return (
                                    <div key={zona}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                                            <span style={{ fontWeight: 500 }}>{zona}</span>
                                            <span style={{ fontWeight: 700, color: '#1e3a8a' }}>{formatCurrency(totalZona)}</span>
                                        </div>
                                        <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                            <div style={{
                                                width: `${porcentaje}%`,
                                                height: '100%',
                                                background: 'linear-gradient(90deg, #1e3a8a, #3b82f6)',
                                                borderRadius: '5px',
                                                transition: 'width 1s ease-in-out'
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
