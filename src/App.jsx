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
                    <div className="filters-title">Filtros</div>
                    <div className="filters-grid">
                        <div className="filter-group">
                            <label className="filter-label">Buscar comercial</label>
                            <input
                                type="text"
                                className="filter-input"
                                placeholder="Nombre..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                        <div className="filter-group">
                            <label className="filter-label">Zona</label>
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
                        <div className="filter-group">
                            <label className="filter-label">Tipo de Gasto</label>
                            <select
                                className="filter-select"
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                            >
                                {tiposGasto.map(tipo => (
                                    <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                {/* Tabla de Comerciales */}
                <section className="table-section">
                    <div className="table-header">
                        <h2 className="table-title">Comerciales</h2>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Zona</th>
                                <th>Combustible</th>
                                <th>Comidas</th>
                                <th>Hoteles</th>
                                <th>Total Mes</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {comercialesFiltrados.map(comercial => (
                                <tr key={comercial.id}>
                                    <td>{comercial.nombre}</td>
                                    <td><span className="zone-badge">{comercial.zona}</span></td>
                                    <td className="amount">{formatCurrency(comercial.gastos.combustible)}</td>
                                    <td className="amount">{formatCurrency(comercial.gastos.comidas)}</td>
                                    <td className="amount">{formatCurrency(comercial.gastos.hoteles)}</td>
                                    <td className="amount">{formatCurrency(comercial.totalMes)}</td>
                                    <td>
                                        <button className="btn-detail">Ver detalle</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            </main>
        </div>
    )
}

export default App
