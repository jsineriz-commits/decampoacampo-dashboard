// Datos de ejemplo para el dashboard
// Después puedes reemplazar esto con tus datos reales

export const comerciales = [
    {
        id: 1,
        nombre: "Juan Pérez",
        zona: "Buenos Aires",
        gastos: {
            combustible: 125000,
            comidas: 45000,
            hoteles: 80000,
            obraSocial: 35000,
            otros: 15000
        },
        totalMes: 300000
    },
    {
        id: 2,
        nombre: "María García",
        zona: "Córdoba",
        gastos: {
            combustible: 98000,
            comidas: 38000,
            hoteles: 65000,
            obraSocial: 35000,
            otros: 12000
        },
        totalMes: 248000
    },
    {
        id: 3,
        nombre: "Carlos López",
        zona: "Santa Fe",
        gastos: {
            combustible: 110000,
            comidas: 52000,
            hoteles: 72000,
            obraSocial: 35000,
            otros: 18000
        },
        totalMes: 287000
    },
    {
        id: 4,
        nombre: "Ana Rodríguez",
        zona: "Mendoza",
        gastos: {
            combustible: 145000,
            comidas: 48000,
            hoteles: 95000,
            obraSocial: 35000,
            otros: 22000
        },
        totalMes: 345000
    },
    {
        id: 5,
        nombre: "Roberto Fernández",
        zona: "Entre Ríos",
        gastos: {
            combustible: 88000,
            comidas: 35000,
            hoteles: 55000,
            obraSocial: 35000,
            otros: 10000
        },
        totalMes: 223000
    },
    {
        id: 6,
        nombre: "Laura Martínez",
        zona: "La Pampa",
        gastos: {
            combustible: 132000,
            comidas: 42000,
            hoteles: 78000,
            obraSocial: 35000,
            otros: 16000
        },
        totalMes: 303000
    }
];

export const zonas = [
    "Todas",
    "Buenos Aires",
    "Córdoba",
    "Santa Fe",
    "Mendoza",
    "Entre Ríos",
    "La Pampa"
];

export const tiposGasto = [
    { id: "todos", nombre: "Todos" },
    { id: "combustible", nombre: "Combustible" },
    { id: "comidas", nombre: "Comidas" },
    { id: "hoteles", nombre: "Hoteles" },
    { id: "obraSocial", nombre: "Obra Social" },
    { id: "otros", nombre: "Otros" }
];

// Función para calcular totales
export const calcularTotales = (data) => {
    return data.reduce((acc, comercial) => {
        acc.combustible += comercial.gastos.combustible;
        acc.comidas += comercial.gastos.comidas;
        acc.hoteles += comercial.gastos.hoteles;
        acc.obraSocial += comercial.gastos.obraSocial;
        acc.otros += comercial.gastos.otros;
        acc.total += comercial.totalMes;
        return acc;
    }, {
        combustible: 0,
        comidas: 0,
        hoteles: 0,
        obraSocial: 0,
        otros: 0,
        total: 0
    });
};

// Función para formatear moneda
export const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};
