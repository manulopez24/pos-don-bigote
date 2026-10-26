require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

app.use(cors());
app.use(express.json());

// Socket.io gestión de salas y conexiones
io.on('connection', (socket) => {
    // Unirse a sala según rol o usuario
    socket.on('unirse_sala', (data) => {
        if (data?.rol) socket.join(`rol_${data.rol}`);
        if (data?.usuario_id) socket.join(`user_${data.usuario_id}`);
    });
});

const JWT_SECRET = process.env.JWT_SECRET || 'don_bigote_secret_jwt_key_2026';
const JWT_EXPIRES = '12h';

// Conexión a MySQL de Hostinger / Local
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'sistema_restaurante',
    port: Number(process.env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0
});

const { PROVEEDORES } = require('./proveedores_seed');
const poolPromise = pool.promise();

// Inicializar tablas adicionales y catálogo de proveedores
async function initTablasAdicionales() {
    try {
        await poolPromise.query(`
            CREATE TABLE IF NOT EXISTS configuracion_sistema (
                clave VARCHAR(50) PRIMARY KEY,
                valor VARCHAR(255) NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `);

        await poolPromise.query(`
            INSERT IGNORE INTO configuracion_sistema (clave, valor)
            VALUES ('ventas_bloqueadas', '0')
        `);

        await poolPromise.query(`
            CREATE TABLE IF NOT EXISTS proveedores (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ruc VARCHAR(20) NOT NULL UNIQUE,
                razon_social VARCHAR(150) NOT NULL,
                nombre_comercial VARCHAR(150),
                categoria VARCHAR(100),
                telefono VARCHAR(50),
                direccion VARCHAR(200),
                contacto VARCHAR(100),
                activo TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `);

        const [cnt] = await poolPromise.query(`SELECT COUNT(*) as cant FROM proveedores`);
        if (cnt[0].cant === 0 && PROVEEDORES && PROVEEDORES.length > 0) {
            console.log(`📦 Inicializando catálogo de ${PROVEEDORES.length} proveedores gastronómicos...`);
            for (const p of PROVEEDORES) {
                await poolPromise.query(`
                    INSERT IGNORE INTO proveedores (ruc, razon_social, nombre_comercial, categoria, telefono, direccion, contacto, activo)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
                `, [p.ruc, p.razon_social, p.nombre_comercial, p.categoria, p.telefono, p.direccion, p.contacto]);
            }
            console.log('✅ Catálogo de 50 distribuidores listo en MySQL.');
        }

        // Asegurar que el ENUM de kardex soporte ENTRADA_DEVOLUCION
        try {
            await poolPromise.query(`
                ALTER TABLE kardex MODIFY COLUMN tipo_movimiento 
                ENUM('ENTRADA_COMPRA','SALIDA_VENTA','SALIDA_MERMA','AJUSTE_POSITIVO','AJUSTE_NEGATIVO','ENTRADA_DEVOLUCION') NOT NULL
            `);
        } catch (kErr) {}
    } catch (err) {
        console.error('⚠️ Error inicializando tablas adicionales:', err.message);
    }
}

// Verificar conexión y liberar el recurso
pool.getConnection((err, conn) => {
    if (err) {
        console.error('❌ Error conectando a MySQL:', err.code || err.message);
        return;
    }

    console.log('✅ Conectado exitosamente a MySQL de Don Bigote!');
    conn.release();
    initTablasAdicionales();
});

// ── Middleware JWT ─────────────────────────────────────────────
function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token requerido.' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Sesión expirada o token inválido.' });
        
        // Verificar validez contra base de datos (token_version y usuario activo)
        pool.query(`SELECT id, nombre, usuario, rol, activo, token_version FROM usuarios WHERE id = ? LIMIT 1`, [decoded.id], (dbErr, results) => {
            if (dbErr || !results || results.length === 0) {
                return res.status(401).json({ error: 'Usuario no encontrado o sesión inválida.' });
            }
            const userDb = results[0];
            if (!userDb.activo) {
                return res.status(403).json({ error: 'Tu cuenta ha sido desactivada por el Administrador.' });
            }
            if (decoded.token_version && userDb.token_version !== decoded.token_version) {
                return res.status(401).json({ error: 'Sesión revocada. Por favor ingresa nuevamente.' });
            }

            req.usuario = { id: userDb.id, nombre: userDb.nombre, usuario: userDb.usuario, rol: userDb.rol };
            next();
        });
    });
}

function verificarAdmin(req, res, next) {
    if (req.usuario.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso restringido. Solo el Administrador puede realizar esta acción.' });
    }
    next();
}

// ══════════════════════════════════════════════════════════════
// RUTAS DE LA API
// ══════════════════════════════════════════════════════════════

// 1. POST /api/login — Login
app.post('/api/login', (req, res) => {
    const { usuario, password } = req.body;
    if (!usuario || !password) return res.status(400).json({ error: 'Ingresa usuario y contraseña.' });

    const query = `SELECT id, nombre, usuario, password, rol, activo, token_version FROM usuarios WHERE usuario = ? LIMIT 1`;
    pool.query(query, [usuario], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!results || results.length === 0) return res.status(401).json({ error: 'Usuario no encontrado.' });

        const user = results[0];
        if (user.activo === 0 || user.activo === false) return res.status(403).json({ error: 'Usuario inactivo.' });
        if (password !== user.password) return res.status(401).json({ error: 'Contraseña incorrecta.' });

        const payload = { 
            id: user.id, 
            nombre: user.nombre, 
            usuario: user.usuario, 
            rol: user.rol,
            token_version: user.token_version || 1
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
        res.json({ message: 'Login exitoso', token, usuario: payload });
    });
});

// GET /api/mesas — Obtener estado visual de todas las mesas
app.get('/api/mesas', verificarToken, (req, res) => {
    pool.query(`SELECT id, nombre, estado FROM mesas ORDER BY id ASC`, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 2. GET /api/menu — Menú real desde MySQL
app.get('/api/menu', verificarToken, (req, res) => {
    const query = `
        SELECT p.id, p.nombre, p.precio, c.nombre as categoria
        FROM productos p
        JOIN categorias c ON p.categoria_id = c.id
        WHERE p.disponible = TRUE
        ORDER BY c.nombre, p.nombre
    `;
    pool.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 3. POST /api/pedidos — Guardar o AGREGAR a comanda con CONTROL TRANSACCIONAL DE STOCK Y KARDEX
app.post('/api/pedidos', verificarToken, async (req, res) => {
    const { mesa_nombre, items, tipo_pedido = 'Mesa' } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'Comanda vacía.' });

    // Verificar si las ventas están bloqueadas por Cierre de Fin de Día
    try {
        const [cfg] = await poolPromise.query(`SELECT valor FROM configuracion_sistema WHERE clave = 'ventas_bloqueadas' LIMIT 1`);
        if (cfg.length > 0 && cfg[0].valor === '1') {
            return res.status(400).json({ error: '⛔ Las ventas se encuentran bloqueadas por Cierre de Fin de Día. Solicite al Administrador reactivar la jornada.' });
        }
    } catch (e) {}

    const conn = await poolPromise.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Obtener información de productos ordenados (directos vs preparados con recetas)
        const prodIds = items.map(i => i.id);
        const [productosDb] = await conn.query(`
            SELECT id, nombre, tipo_producto, insumo_directo_id, disponible
            FROM productos
            WHERE id IN (?)
        `, [prodIds]);

        const prodMap = {};
        productosDb.forEach(p => { prodMap[p.id] = p; });

        // 2. Calcular explosión de insumos requeridos por la orden
        // Insumo ID -> { requerido: number, producto_nombre: string, es_critico: boolean }
        const requerimientosInsumos = {};

        // Insumos de productos directos
        items.forEach(item => {
            const prod = prodMap[item.id];
            if (prod && prod.tipo_producto === 'DIRECTO' && prod.insumo_directo_id) {
                const insId = prod.insumo_directo_id;
                requerimientosInsumos[insId] = (requerimientosInsumos[insId] || 0) + Number(item.cantidad);
            }
        });

        // Insumos de recetas para productos preparados
        const [recetas] = await conn.query(`
            SELECT producto_id, insumo_id, cantidad_requerida, es_critico
            FROM recetas_detalles
            WHERE producto_id IN (?)
        `, [prodIds]);

        recetas.forEach(rec => {
            const itemPedido = items.find(i => i.id === rec.producto_id);
            if (itemPedido) {
                const cantTotalInsumo = Number(itemPedido.cantidad) * Number(rec.cantidad_requerida);
                requerimientosInsumos[rec.insumo_id] = (requerimientosInsumos[rec.insumo_id] || 0) + cantTotalInsumo;
            }
        });

        const insumosIdsAfectados = Object.keys(requerimientosInsumos).map(Number).sort((a, b) => a - b);

        // 3. BLOQUEO PESIMISTA: SELECT ... FOR UPDATE ordenado para evitar Deadlocks
        let insumosEnDb = [];
        if (insumosIdsAfectados.length > 0) {
            const [rows] = await conn.query(`
                SELECT id, codigo, nombre, stock_actual, unidad_medida, costo_unitario
                FROM insumos
                WHERE id IN (?)
                ORDER BY id ASC
                FOR UPDATE
            `, [insumosIdsAfectados]);
            insumosEnDb = rows;
        }

        // 4. Validar disponibilidad estricta de stock
        for (const insumo of insumosEnDb) {
            const solicitado = requerimientosInsumos[insumo.id] || 0;
            const stockActual = Number(insumo.stock_actual);

            if (stockActual < solicitado) {
                await conn.rollback();
                return res.status(409).json({
                    error: 'STOCK_INSUFICIENTE',
                    message: `Stock insuficiente para '${insumo.nombre}'. Disponible: ${stockActual} ${insumo.unidad_medida}, Requerido: ${solicitado} ${insumo.unidad_medida}.`,
                    insumo: insumo.nombre,
                    disponible: stockActual,
                    solicitado
                });
            }
        }

        // 5. Obtener Mesa
        const [mRes] = await conn.query(`SELECT id FROM mesas WHERE nombre = ? LIMIT 1`, [mesa_nombre || 'Mesa 1']);
        const mesaId = (mRes && mRes.length > 0) ? mRes[0].id : null;

        // 6. Determinar o crear pedido
        const nuevoSubtotal = items.reduce((acc, i) => acc + (parseFloat(i.precio) * i.cantidad), 0);
        let pedidoId;
        let esAdicional = false;

        const [cRes] = await conn.query(`
            SELECT id, total FROM pedidos 
            WHERE mesa_id = ? AND estado_global = 'Abierto' 
            LIMIT 1
            FOR UPDATE
        `, [mesaId]);

        if (cRes && cRes.length > 0) {
            pedidoId = cRes[0].id;
            esAdicional = true;
            const nuevoTotalCalculado = parseFloat(cRes[0].total) + nuevoSubtotal;
            await conn.query(`UPDATE pedidos SET total = ?, version = version + 1 WHERE id = ?`, [nuevoTotalCalculado, pedidoId]);
        } else {
            const [pRes] = await conn.query(`
                INSERT INTO pedidos (tipo_pedido, mesa_id, nombre_cliente, usuario_mesero_id, estado_global, total)
                VALUES (?, ?, ?, ?, 'Abierto', ?)
            `, [tipo_pedido, mesaId, req.usuario.nombre, req.usuario.id, nuevoSubtotal]);
            pedidoId = pRes.insertId;
            if (mesaId) {
                await conn.query(`UPDATE mesas SET estado = 'Ocupada' WHERE id = ?`, [mesaId]);
            }
        }

        // 7. Insertar detalles de comanda
        const detallesValues = items.map(i => [pedidoId, i.id, i.cantidad, i.notas || '', 'Pendiente']);
        await conn.query(`
            INSERT INTO detalles_pedido (pedido_id, producto_id, cantidad, notas_cocina, estado_cocina)
            VALUES ?
        `, [detallesValues]);

        // 8. Descontar Stock e Insertar en el Libro Mayor (Kardex)
        for (const insumo of insumosEnDb) {
            const cantidadSalida = requerimientosInsumos[insumo.id] || 0;
            const stockAnterior = Number(insumo.stock_actual);
            const stockNuevo = stockAnterior - cantidadSalida;

            // Actualizar stock del insumo
            await conn.query(`UPDATE insumos SET stock_actual = ? WHERE id = ?`, [stockNuevo, insumo.id]);

            // Asentar movimiento en el Kardex
            await conn.query(`
                INSERT INTO kardex (insumo_id, usuario_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, costo_unitario, referencia_id, motivo)
                VALUES (?, ?, 'SALIDA_VENTA', ?, ?, ?, ?, ?, ?)
            `, [
                insumo.id,
                req.usuario.id,
                cantidadSalida,
                stockAnterior,
                stockNuevo,
                insumo.costo_unitario,
                pedidoId,
                `Salida por Comanda Pedido #${pedidoId} (${mesa_nombre || 'Mesa'})`
            ]);
        }

        // 9. Confirmar Transacción ACID
        await conn.commit();

        // 10. Emisiones en Tiempo Real vía Socket.io
        io.emit('NUEVA_COMANDA', { pedido_id: pedidoId, mesa: mesa_nombre, tipo: esAdicional ? 'adicional' : 'nuevo' });
        io.emit('CAMBIO_MESAS', { mesa_id: mesaId, estado: 'Ocupada' });
        io.emit('STOCK_ACTUALIZADO', { insumos_afectados: insumosIdsAfectados });

        res.json({
            message: esAdicional ? 'Nuevos productos agregados a comanda' : 'Comanda enviada con éxito',
            pedido_id: pedidoId
        });

    } catch (error) {
        await conn.rollback();
        console.error('Error procesando pedido transaccional:', error);
        res.status(500).json({ error: error.message || 'Error interno al procesar comanda' });
    } finally {
        conn.release();
    }
});

// 4. GET /api/mesero/mis-pedidos — Ver comandas activas del mesero y estado de cocina
app.get('/api/mesero/mis-pedidos', verificarToken, (req, res) => {
    const query = `
        SELECT 
            p.id as pedido_id,
            COALESCE(m.nombre, 'Llevar') as mesa,
            p.total,
            TIME_FORMAT(p.fecha_hora, '%H:%i') as hora,
            dp.id as detalle_id,
            pr.nombre as producto_nombre,
            dp.cantidad,
            dp.estado_cocina,
            pr.tipo_producto,
            c.nombre as categoria_nombre
        FROM pedidos p
        LEFT JOIN mesas m ON p.mesa_id = m.id
        JOIN detalles_pedido dp ON dp.pedido_id = p.id
        JOIN productos pr ON dp.producto_id = pr.id
        LEFT JOIN categorias c ON pr.categoria_id = c.id
        WHERE p.estado_global = 'Abierto' AND p.nombre_cliente = ?
        ORDER BY p.fecha_hora DESC, dp.id ASC
    `;

    pool.query(query, [req.usuario.nombre], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        const misPedidosMap = {};
        results.forEach(row => {
            if (!misPedidosMap[row.pedido_id]) {
                misPedidosMap[row.pedido_id] = {
                    pedido_id: row.pedido_id,
                    mesa: row.mesa,
                    total: row.total,
                    hora: row.hora,
                    items: []
                };
            }
            misPedidosMap[row.pedido_id].items.push({
                detalle_id: row.detalle_id,
                nombre: row.producto_nombre,
                cantidad: row.cantidad,
                estado_cocina: row.estado_cocina,
                tipo_producto: row.tipo_producto,
                categoria: row.categoria_nombre
            });
        });

        res.json(Object.values(misPedidosMap));
    });
});

// 5. GET /api/cocina/pedidos — EXCLUIR BEBIDAS Y AGREGAR RECETA DE INSUMOS
app.get('/api/cocina/pedidos', verificarToken, async (req, res) => {
    try {
        const query = `
            SELECT 
                dp.id as detalle_id,
                p.id as pedido_id,
                COALESCE(m.nombre, 'Para Llevar') as mesa,
                p.nombre_cliente as mesero,
                TIME_FORMAT(p.fecha_hora, '%H:%i') as hora,
                pr.id as producto_id,
                pr.nombre as producto_nombre,
                dp.cantidad,
                dp.notas_cocina,
                dp.estado_cocina
            FROM detalles_pedido dp
            JOIN pedidos p ON dp.pedido_id = p.id
            JOIN productos pr ON dp.producto_id = pr.id
            JOIN categorias c ON pr.categoria_id = c.id
            LEFT JOIN mesas m ON p.mesa_id = m.id
            WHERE p.estado_global = 'Abierto' 
              AND dp.estado_cocina IN ('Pendiente', 'Preparando')
              AND c.nombre NOT IN ('Bebidas', 'Bebidas Frías', 'Cervezas', 'Helados')
            ORDER BY p.fecha_hora ASC, dp.id ASC
        `;

        const [results] = await poolPromise.query(query);

        // Obtener todas las recetas para los productos en cocina
        const prodIds = [...new Set(results.map(r => r.producto_id))];
        let recetasMap = {};

        if (prodIds.length > 0) {
            const [recetas] = await poolPromise.query(`
                SELECT r.producto_id, r.cantidad_requerida, r.es_critico, i.nombre as insumo_nombre, i.unidad_medida
                FROM recetas_detalles r
                JOIN insumos i ON r.insumo_id = i.id
                WHERE r.producto_id IN (?)
            `, [prodIds]);

            recetas.forEach(rec => {
                if (!recetasMap[rec.producto_id]) recetasMap[rec.producto_id] = [];
                recetasMap[rec.producto_id].push(rec);
            });
        }

        const comandasMap = {};
        results.forEach(row => {
            if (!comandasMap[row.pedido_id]) {
                comandasMap[row.pedido_id] = {
                    id: row.pedido_id,
                    mesa: row.mesa,
                    mesero: row.mesero,
                    hora: row.hora,
                    items: []
                };
            }

            const recetasPlato = recetasMap[row.producto_id] || [];
            const insumosCalculados = recetasPlato.map(r => ({
                insumo: r.insumo_nombre,
                cantidad_unitaria: Number(r.cantidad_requerida),
                cantidad_total: Number(r.cantidad_requerida) * Number(row.cantidad),
                unidad: r.unidad_medida,
                es_critico: Boolean(r.es_critico)
            }));

            comandasMap[row.pedido_id].items.push({
                detalle_id: row.detalle_id,
                nombre: row.producto_nombre,
                cantidad: row.cantidad,
                notas: row.notas_cocina,
                estado_cocina: row.estado_cocina,
                insumos: insumosCalculados
            });
        });

        res.json(Object.values(comandasMap));
    } catch (err) {
        console.error('Error cargando comandas para cocina:', err);
        res.status(500).json({ error: err.message });
    }
});

// 6. PUT /api/cocina/detalles/:id/estado — Estado cocina o entrega de bebidas
app.put('/api/cocina/detalles/:id/estado', verificarToken, async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    try {
        // Verificar si el producto es bebida o de despacho directo
        const [rows] = await poolPromise.query(`
            SELECT dp.id, dp.estado_cocina, pr.tipo_producto, c.nombre as categoria_nombre
            FROM detalles_pedido dp
            JOIN productos pr ON dp.producto_id = pr.id
            LEFT JOIN categorias c ON pr.categoria_id = c.id
            WHERE dp.id = ?
        `, [id]);

        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'Detalle de pedido no encontrado' });
        }

        const item = rows[0];
        const esBebidaODirecto = item.tipo_producto === 'DIRECTO' || 
            ['Bebidas', 'Bebidas Frías', 'Cervezas', 'Helados'].includes(item.categoria_nombre);

        // Si es plato de cocina, solo personal de cocina o admin pueden cambiar el estado
        if (!esBebidaODirecto && req.usuario.rol !== 'cocina' && req.usuario.rol !== 'admin') {
            return res.status(403).json({ error: 'Solo el personal de cocina o el administrador pueden actualizar el estado de los platillos.' });
        }

        await poolPromise.query(`UPDATE detalles_pedido SET estado_cocina = ? WHERE id = ?`, [estado, id]);
        
        // Notificar en tiempo real a Cocina, Meseros y Caja
        io.emit('ESTADO_COCINA_ACTUALIZADO', { detalle_id: Number(id), estado });

        res.json({ message: 'Estado actualizado con éxito', estado });
    } catch (err) {
        console.error('Error actualizando estado de detalle:', err);
        res.status(500).json({ error: err.message });
    }
});

// 7. GET /api/caja/pedidos — Cuentas abiertas para Cajero
app.get('/api/caja/pedidos', verificarToken, (req, res) => {
    const query = `
        SELECT 
            p.id as pedido_id,
            COALESCE(m.nombre, 'Llevar/Delivery') as mesa,
            p.nombre_cliente as mesero,
            p.total,
            p.estado_global,
            TIME_FORMAT(p.fecha_hora, '%H:%i') as hora,
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'detalle_id', dp.id,
                    'producto_id', pr.id,
                    'nombre', pr.nombre,
                    'cantidad', dp.cantidad,
                    'precio', pr.precio,
                    'subtotal', (dp.cantidad * pr.precio),
                    'estado_cocina', dp.estado_cocina
                )
            ) as items
        FROM pedidos p
        LEFT JOIN mesas m ON p.mesa_id = m.id
        JOIN detalles_pedido dp ON dp.pedido_id = p.id
        JOIN productos pr ON dp.producto_id = pr.id
        WHERE p.estado_global = 'Abierto'
        GROUP BY p.id
        ORDER BY p.fecha_hora DESC
    `;
    pool.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        const parsed = results.map(r => ({
            ...r,
            items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items
        }));
        res.json(parsed);
    });
});

// 8. POST /api/caja/pedidos/:id/cobrar — PROCESO CRÍTICO: Cobro Transaccional ACID y Prevención de Doble Cobro
app.post('/api/caja/pedidos/:id/cobrar', verificarToken, async (req, res) => {
    const { id } = req.params;
        const {
            tipo_comprobante = 'Boleta Simple',
            doc_cliente = '',
            nombre_cliente = 'PÚBLICO GENERAL',
            metodo_pago = 'Efectivo',
            monto_recibido = 0,
            vuelto = 0,
            descuento = 0,
            propina = 0,
            total = 0
        } = req.body;

        // Verificar si las ventas están bloqueadas por Cierre de Fin de Día
        try {
            const [cfg] = await poolPromise.query(`SELECT valor FROM configuracion_sistema WHERE clave = 'ventas_bloqueadas' LIMIT 1`);
            if (cfg.length > 0 && cfg[0].valor === '1') {
                return res.status(400).json({ error: '⛔ La jornada de ventas ha sido finalizada (Fin de Día). Solicite al Administrador reactivar las ventas para cobrar.' });
            }
        } catch (e) {}

        const conn = await poolPromise.getConnection();
        try {
            await conn.beginTransaction();

            // 1. BLOQUEO PESIMISTA: SELECT FOR UPDATE sobre el pedido
            const [pedidos] = await conn.query(`
                SELECT id, mesa_id, estado_global, total, version 
                FROM pedidos 
                WHERE id = ? 
                FOR UPDATE
            `, [id]);

            if (!pedidos || pedidos.length === 0) {
                await conn.rollback();
                return res.status(404).json({ error: 'Pedido no encontrado.' });
            }

            const pedido = pedidos[0];

            // 2. Comprobación estricta de estado: Si no está Abierto, ya fue cobrado
            if (pedido.estado_global !== 'Abierto') {
                await conn.rollback();
                return res.status(409).json({
                    error: 'PEDIDO_YA_COBRADO',
                    message: `El pedido #${id} ya fue cobrado o cancelado por otro terminal. Estado actual: ${pedido.estado_global}.`
                });
            }

            // 3. Obtener turno activo si existe
            const [turnosActivos] = await conn.query(`
                SELECT id FROM turnos_caja 
                WHERE estado = 'Abierto' 
                ORDER BY id DESC LIMIT 1
            `);
            const turnoId = (turnosActivos && turnosActivos.length > 0) ? turnosActivos[0].id : null;

            // 4. Generar correlativo de comprobante
            const [cRes] = await conn.query(`SELECT COUNT(*) as cant FROM comprobantes`);
            const num = (cRes && cRes[0].cant) ? cRes[0].cant + 1 : 1;
            const prefijo = tipo_comprobante === 'Factura' ? 'F001' : 'B001';
            const correlativo = `${prefijo}-${String(num).padStart(6, '0')}`;

            // 5. Insertar comprobante (con registro de descuento fidelidad y propina voluntaria si aplica)
            const [iRes] = await conn.query(`
                INSERT INTO comprobantes 
                (pedido_id, serie_correlativo, tipo_comprobante, doc_cliente, nombre_cliente, metodo_pago, monto_recibido, vuelto, descuento, propina, total)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [id, correlativo, tipo_comprobante, doc_cliente, nombre_cliente, metodo_pago, monto_recibido, vuelto, descuento, propina || 0, total]);

            // Auto-registro/actualización en tabla clientes (solo dni, nombre y veces/visitas)
            const docLimpio = (doc_cliente || '').replace(/\D/g, '').trim();
            const nomLimpio = (nombre_cliente || '').trim();
            if ((docLimpio.length === 8 || docLimpio.length === 11) && nomLimpio && nomLimpio !== 'PÚBLICO GENERAL') {
                const [clExistente] = await conn.query(`SELECT id, nombre, visitas FROM clientes WHERE dni = ? LIMIT 1`, [docLimpio]);
                if (clExistente.length > 0) {
                    // Cliente existente: solo incrementamos visitas (veces en el restaurante)
                    await conn.query(`
                        UPDATE clientes 
                        SET visitas = visitas + 1, updated_at = NOW() 
                        WHERE id = ?
                    `, [clExistente[0].id]);
                } else {
                    // Cliente completamente nuevo: registrar automáticamente con su 1ra visita
                    await conn.query(`
                        INSERT INTO clientes (dni, nombre, visitas)
                        VALUES (?, ?, 1)
                    `, [docLimpio, nomLimpio]);
                }
            }

            // 6. Insertar en tabla pagos (con restricción uk_pedido_pago_unico) si hay turno
            if (turnoId) {
                await conn.query(`
                    INSERT INTO pagos (pedido_id, turno_id, cajero_id, metodo_pago, monto)
                    VALUES (?, ?, ?, ?, ?)
                `, [id, turnoId, req.usuario.id, metodo_pago, total]);
            }

            // 7. Cerrar pedido y liberar mesa
            await conn.query(`
                UPDATE pedidos 
                SET estado_global = 'Cerrado', cerrado_por_usuario_id = ?, fecha_cierre = NOW(), version = version + 1
                WHERE id = ?
            `, [req.usuario.id, id]);

            if (pedido.mesa_id) {
                await conn.query(`UPDATE mesas SET estado = 'Libre' WHERE id = ?`, [pedido.mesa_id]);
            }

            // 8. Confirmar Transacción ACID
            await conn.commit();

            // 9. Notificar en Tiempo Real
            io.emit('PEDIDO_COBRADO', { pedido_id: Number(id), comprobante: correlativo });
            if (pedido.mesa_id) {
                io.emit('CAMBIO_MESAS', { mesa_id: pedido.mesa_id, estado: 'Libre' });
            }

            res.json({
                message: 'Cobro y emisión de boleta exitoso',
                comprobante: {
                    id: iRes.insertId,
                    correlativo,
                    tipo_comprobante,
                    doc_cliente,
                    nombre_cliente,
                    metodo_pago,
                    monto_recibido,
                    vuelto,
                    descuento,
                    propina: Number(propina || 0),
                    total,
                    fecha_emision: new Date().toISOString()
                }
            });

    } catch (error) {
        await conn.rollback();
        console.error('Error procesando cobro transaccional:', error);
        res.status(500).json({ error: error.message || 'Error interno al procesar cobro' });
    } finally {
        conn.release();
    }
});

// 9. GET /api/caja/comprobantes — Historial de boletas
app.get('/api/caja/comprobantes', verificarToken, (req, res) => {
    const query = `
        SELECT 
            c.id,
            c.serie_correlativo,
            c.tipo_comprobante,
            c.doc_cliente,
            c.nombre_cliente,
            c.metodo_pago,
            c.monto_recibido,
            c.vuelto,
            c.total,
            TIME_FORMAT(c.fecha_emision, '%H:%i') as hora,
            DATE_FORMAT(c.fecha_emision, '%d/%m/%Y') as fecha,
            p.nombre_cliente as mesero,
            COALESCE(m.nombre, 'Llevar/Delivery') as mesa
        FROM comprobantes c
        JOIN pedidos p ON c.pedido_id = p.id
        LEFT JOIN mesas m ON p.mesa_id = m.id
        ORDER BY c.fecha_emision DESC
    `;
    pool.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 10. GET /api/caja/cierre-preview — Previsualizar Cierre (Medio Día vs Fin de Día)
app.get('/api/caja/cierre-preview', verificarToken, async (req, res) => {
    const tipo = req.query.tipo || 'MEDIO_DIA'; // 'MEDIO_DIA' | 'FIN_DIA'

    try {
        let statsQuery = '';
        let queryParams = [];

        if (tipo === 'MEDIO_DIA') {
            // Medio Día: ventas de hoy desde el último cierre de medio día
            const [lastCierre] = await poolPromise.query(`
                SELECT fecha_cierre FROM cierres_caja 
                WHERE DATE(fecha_cierre) = CURDATE() AND tipo_cierre = 'MEDIO_DIA'
                ORDER BY id DESC LIMIT 1
            `);
            const cutoff = (lastCierre && lastCierre.length > 0) ? lastCierre[0].fecha_cierre : null;

            statsQuery = `
                SELECT 
                    COALESCE(SUM(total), 0) as total_ventas,
                    COALESCE(SUM(descuento), 0) as total_descuentos,
                    COALESCE(SUM(propina), 0) as total_propinas,
                    COUNT(*) as boletas_emitidas,
                    COALESCE(SUM(CASE WHEN metodo_pago = 'Efectivo' THEN total ELSE 0 END), 0) as monto_efectivo,
                    COALESCE(SUM(CASE WHEN metodo_pago IN ('Yape', 'Plin') THEN total ELSE 0 END), 0) as monto_yape,
                    COALESCE(SUM(CASE WHEN metodo_pago LIKE '%Mixto%' THEN total ELSE 0 END), 0) as monto_mixto
                FROM comprobantes
                WHERE DATE(fecha_emision) = CURDATE()
                ${cutoff ? 'AND fecha_emision > ?' : ''}
            `;
            if (cutoff) queryParams.push(cutoff);
        } else {
            // FIN_DIA: Consolidado de todo el día completo de hoy
            statsQuery = `
                SELECT 
                    COALESCE(SUM(total), 0) as total_ventas,
                    COALESCE(SUM(descuento), 0) as total_descuentos,
                    COALESCE(SUM(propina), 0) as total_propinas,
                    COUNT(*) as boletas_emitidas,
                    COALESCE(SUM(CASE WHEN metodo_pago = 'Efectivo' THEN total ELSE 0 END), 0) as monto_efectivo,
                    COALESCE(SUM(CASE WHEN metodo_pago IN ('Yape', 'Plin') THEN total ELSE 0 END), 0) as monto_yape,
                    COALESCE(SUM(CASE WHEN metodo_pago LIKE '%Mixto%' THEN total ELSE 0 END), 0) as monto_mixto
                FROM comprobantes
                WHERE DATE(fecha_emision) = CURDATE()
            `;
        }

        const [results] = await poolPromise.query(statsQuery, queryParams);
        const stats = results[0] || {};
        res.json({
            ...stats,
            tipo_cierre: tipo,
            fecha: new Date().toLocaleDateString('es-PE'),
            hora: new Date().toLocaleTimeString('es-PE')
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 11. POST /api/caja/cierre — Ejecutar Cierre (Medio Día o Fin de Día)
app.post('/api/caja/cierre', verificarToken, async (req, res) => {
    const { 
        tipo_cierre = 'MEDIO_DIA', 
        monto_efectivo = 0, 
        monto_yape = 0, 
        monto_mixto = 0,
        total_propinas = 0,
        total_ventas = 0, 
        boletas_emitidas = 0, 
        observaciones = '' 
    } = req.body;
    const cajero = req.usuario.nombre;

    try {
        const [result] = await poolPromise.query(`
            INSERT INTO cierres_caja (cajero_nombre, tipo_cierre, monto_efectivo, monto_yape, monto_mixto, total_propinas, total_ventas, boletas_emitidas, observaciones)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [cajero, tipo_cierre, monto_efectivo, monto_yape, monto_mixto, total_propinas, total_ventas, boletas_emitidas, observaciones]);

        let backupGenerado = null;
        if (tipo_cierre === 'FIN_DIA') {
            try {
                const backupsDir = path.join(__dirname, 'backups');
                if (!fs.existsSync(backupsDir)) {
                    fs.mkdirSync(backupsDir, { recursive: true });
                }
                const now = new Date();
                const stamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
                const filename = `cierre_dia_${stamp}.sql`;
                const filePath = path.join(backupsDir, filename);
                const sqlContent = await generarDumpSQL();
                fs.writeFileSync(filePath, sqlContent, 'utf8');
                backupGenerado = filename;
            } catch (bErr) {
                console.error('Error generando backup automático en fin de día:', bErr);
            }
        }

        if (tipo_cierre === 'MEDIO_DIA') {
            try {
                await poolPromise.query(`
                    INSERT INTO configuracion_sistema (clave, valor) VALUES ('cierre_medio_dia_id', ?)
                    ON DUPLICATE KEY UPDATE valor = ?
                `, [String(result.insertId), String(result.insertId)]);
            } catch (cfgErr) {}
            io.emit('ESTADO_JORNADA_ACTUALIZADO', {
                tipo: 'MEDIO_DIA',
                medio_dia_cerrado: true,
                cierre_id: result.insertId,
                cajero,
                total_ventas,
                boletas_emitidas,
                fecha: new Date().toLocaleTimeString('es-PE')
            });
        } else if (tipo_cierre === 'FIN_DIA') {
            try {
                await poolPromise.query(`
                    INSERT INTO configuracion_sistema (clave, valor) VALUES ('ventas_bloqueadas', '1')
                    ON DUPLICATE KEY UPDATE valor = '1'
                `);
                await poolPromise.query(`
                    INSERT INTO configuracion_sistema (clave, valor) VALUES ('cierre_fin_dia_id', ?)
                    ON DUPLICATE KEY UPDATE valor = ?
                `, [String(result.insertId), String(result.insertId)]);
            } catch (cfgErr) {}
            io.emit('ESTADO_JORNADA_ACTUALIZADO', {
                tipo: 'FIN_DIA',
                ventas_bloqueadas: true,
                cierre_id: result.insertId,
                cajero,
                total_ventas,
                boletas_emitidas,
                fecha: new Date().toLocaleTimeString('es-PE')
            });
            io.emit('VENTAS_BLOQUEADAS', { motivo: 'Jornada diaria cerrada' });
        }

        res.json({
            message: tipo_cierre === 'FIN_DIA' 
                ? `Jornada diaria finalizada con éxito. Copia de respaldo automática: ${backupGenerado || 'generada'}`
                : 'Caja de Medio Día cerrada con éxito',
            cierre_id: result.insertId,
            tipo_cierre,
            backup_generado: backupGenerado
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/caja/estado-jornada — Consultar estado de jornada, cierres de hoy y control de bloqueos
app.get('/api/caja/estado-jornada', verificarToken, async (req, res) => {
    try {
        const [cfgs] = await poolPromise.query(`SELECT clave, valor FROM configuracion_sistema`);
        const cfgMap = {};
        cfgs.forEach(c => { cfgMap[c.clave] = c.valor; });
        const ventasBloqueadas = cfgMap['ventas_bloqueadas'] === '1';

        // Todos los cierres registrados el día de hoy
        const [cierresHoy] = await poolPromise.query(`
            SELECT id, cajero_nombre, tipo_cierre, total_ventas, boletas_emitidas, fecha_cierre, monto_efectivo, monto_yape, monto_mixto, total_propinas, observaciones
            FROM cierres_caja
            WHERE DATE(fecha_cierre) = CURDATE()
            ORDER BY id DESC
        `);

        // Último cierre de medio día general y específico para el cajero actual
        const cierresMedioDia = cierresHoy.filter(c => c.tipo_cierre === 'MEDIO_DIA');
        const ultimoMedioDia = cierresMedioDia.length > 0 ? cierresMedioDia[0] : null;
        const miCierreMedioDia = cierresMedioDia.find(c => c.cajero_nombre === req.usuario.nombre) || null;

        // Cierre de fin de día
        const cierresFinDia = cierresHoy.filter(c => c.tipo_cierre === 'FIN_DIA');
        const ultimoFinDia = cierresFinDia.length > 0 ? cierresFinDia[0] : null;

        res.json({
            ventas_bloqueadas: ventasBloqueadas,
            cierres_hoy: cierresHoy,
            medio_dia_cerrado: !!ultimoMedioDia,
            mi_medio_dia_cerrado: !!miCierreMedioDia,
            ultimo_cierre_medio_dia: ultimoMedioDia,
            fin_dia_cerrado: !!ultimoFinDia,
            ultimo_cierre_fin_dia: ultimoFinDia
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/jornada/reactivar — Desbloquear ventas y reabrir jornada si se cerró por error el mismo día
app.post('/api/admin/jornada/reactivar', verificarToken, async (req, res) => {
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'cajero') {
        return res.status(403).json({ error: 'Solo la Administración o Supervisión de Caja puede reactivar la jornada.' });
    }

    try {
        await poolPromise.query(`
            INSERT INTO configuracion_sistema (clave, valor) VALUES ('ventas_bloqueadas', '0')
            ON DUPLICATE KEY UPDATE valor = '0'
        `);

        const horaAudit = new Date().toLocaleTimeString('es-PE');
        // Registrar la reapertura en la observación del cierre para trazabilidad
        await poolPromise.query(`
            UPDATE cierres_caja 
            SET observaciones = CONCAT(COALESCE(observaciones, ''), ' [REAPERTURA: Jornada reactivada el mismo día a las ', ?, ' por ', ?, ']')
            WHERE DATE(fecha_cierre) = CURDATE() AND tipo_cierre = 'FIN_DIA'
            ORDER BY id DESC LIMIT 1
        `, [horaAudit, req.usuario.nombre]).catch(() => {});

        io.emit('ESTADO_JORNADA_ACTUALIZADO', { ventas_bloqueadas: false });
        io.emit('VENTAS_REACTIVADAS', { mensaje: 'Jornada y ventas reactivadas exitosamente' });

        res.json({ message: '✅ Jornada de ventas reactivada exitosamente. Meseros y Caja pueden operar con total normalidad.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/proveedores — Catálogo de los 50 distribuidores y proveedores oficiales
app.get('/api/admin/proveedores', verificarToken, async (req, res) => {
    try {
        const [rows] = await poolPromise.query(`
            SELECT id, ruc, razon_social, razon_social as nombre_empresa, nombre_comercial, categoria, telefono, direccion, contacto
            FROM proveedores
            WHERE activo = 1
            ORDER BY razon_social ASC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ══════════════════════════════════════════════════════════════
// CONTROL DE TURNOS DE CAJA (MAÑANA / TARDE)
// ══════════════════════════════════════════════════════════════

// GET /api/caja/turno-activo — Obtener si hay un turno abierto actualmente
app.get('/api/caja/turno-activo', verificarToken, async (req, res) => {
    try {
        const [rows] = await poolPromise.query(`
            SELECT t.*, u.nombre as cajero_nombre 
            FROM turnos_caja t
            JOIN usuarios u ON t.usuario_id = u.id
            WHERE t.estado = 'Abierto'
            ORDER BY t.id DESC LIMIT 1
        `);
        res.json({ turno: rows.length > 0 ? rows[0] : null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/caja/abrir-turno — Iniciar turno (Mañana o Tarde)
app.post('/api/caja/abrir-turno', verificarToken, async (req, res) => {
    const { nombre_turno = 'Mañana', monto_inicial = 0, observaciones = '' } = req.body;
    try {
        const [activos] = await poolPromise.query(`SELECT id FROM turnos_caja WHERE estado = 'Abierto'`);
        if (activos.length > 0) {
            return res.status(400).json({ error: 'Ya existe un turno de caja abierto actualmente.' });
        }

        const [result] = await poolPromise.query(`
            INSERT INTO turnos_caja (usuario_id, nombre_turno, monto_inicial, estado, observaciones)
            VALUES (?, ?, ?, 'Abierto', ?)
        `, [req.usuario.id, nombre_turno, monto_inicial, observaciones]);

        io.emit('TURNO_CAMBIO', { estado: 'Abierto', turno_id: result.insertId });
        res.json({ message: `Turno ${nombre_turno} abierto exitosamente`, turno_id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/caja/cerrar-turno — Cerrar turno activo
app.post('/api/caja/cerrar-turno', verificarToken, async (req, res) => {
    const { turno_id, monto_final_real = 0, observaciones = '' } = req.body;
    try {
        const [turnos] = await poolPromise.query(`SELECT * FROM turnos_caja WHERE id = ? AND estado = 'Abierto'`, [turno_id]);
        if (!turnos || turnos.length === 0) {
            return res.status(404).json({ error: 'Turno no encontrado o ya cerrado.' });
        }
        const turno = turnos[0];

        // Calcular ventas acumuladas en este turno
        const [pagos] = await poolPromise.query(`
            SELECT COALESCE(SUM(monto), 0) as total_cobrado,
                   COALESCE(SUM(CASE WHEN metodo_pago = 'Efectivo' THEN monto ELSE 0 END), 0) as efectivo_cobrado
            FROM pagos 
            WHERE turno_id = ?
        `, [turno_id]);

        const montoEsperado = Number(turno.monto_inicial) + Number(pagos[0].efectivo_cobrado);

        await poolPromise.query(`
            UPDATE turnos_caja 
            SET fecha_cierre = NOW(), monto_final_esperado = ?, monto_final_real = ?, estado = 'Cerrado', observaciones = ?
            WHERE id = ?
        `, [montoEsperado, monto_final_real, observaciones, turno_id]);

        io.emit('TURNO_CAMBIO', { estado: 'Cerrado', turno_id });
        res.json({
            message: 'Turno cerrado con éxito',
            monto_inicial: turno.monto_inicial,
            monto_esperado: montoEsperado,
            monto_real: monto_final_real,
            diferencia: Number(monto_final_real) - montoEsperado
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ══════════════════════════════════════════════════════════════
// RUTAS DE INVENTARIO, INSUMOS & KARDEX
// ══════════════════════════════════════════════════════════════

// GET /api/admin/insumos — Listar insumos y stock
app.get('/api/admin/insumos', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const [rows] = await poolPromise.query(`SELECT * FROM insumos ORDER BY nombre ASC`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/insumos — Crear insumo
app.post('/api/admin/insumos', verificarToken, verificarAdmin, async (req, res) => {
    const { codigo, nombre, descripcion, unidad_medida, stock_actual, stock_minimo, costo_unitario } = req.body;
    try {
        const [result] = await poolPromise.query(`
            INSERT INTO insumos (codigo, nombre, descripcion, unidad_medida, stock_actual, stock_minimo, costo_unitario)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [codigo, nombre, descripcion || '', unidad_medida, stock_actual || 0, stock_minimo || 0, costo_unitario || 0]);

        if (stock_actual > 0) {
            await poolPromise.query(`
                INSERT INTO kardex (insumo_id, usuario_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, costo_unitario, motivo)
                VALUES (?, ?, 'AJUSTE_POSITIVO', ?, 0, ?, ?, 'Saldo Inicial Insumo')
            `, [result.insertId, req.usuario.id, stock_actual, stock_actual, costo_unitario || 0]);
        }

        res.json({ message: 'Insumo creado exitosamente', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/admin/insumos/:id/ajustar — Operación de Kardex por motivo y cantidad (Entrada/Salida/Merma)
app.put('/api/admin/insumos/:id/ajustar', verificarToken, verificarAdmin, async (req, res) => {
    const { id } = req.params;
    const { tipo_operacion, cantidad, motivo_detalle = '' } = req.body;
    // tipo_operacion: 'AGREGAR' | 'MERMA' | 'AJUSTE_NEGATIVO'

    const cantNum = Math.abs(parseFloat(cantidad));
    if (isNaN(cantNum) || cantNum <= 0) {
        return res.status(400).json({ error: 'La cantidad debe ser un número mayor a cero.' });
    }

    const conn = await poolPromise.getConnection();
    try {
        await conn.beginTransaction();

        const [insumos] = await conn.query(`SELECT * FROM insumos WHERE id = ? FOR UPDATE`, [id]);
        if (insumos.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Insumo no encontrado.' });
        }

        const insumo = insumos[0];
        const stockAnterior = Number(insumo.stock_actual);
        let stockNuevo = stockAnterior;
        let tipoKardex = 'AJUSTE_POSITIVO';
        let motivoFinal = motivo_detalle || 'Movimiento de inventario';

        if (tipo_operacion === 'AGREGAR') {
            stockNuevo = stockAnterior + cantNum;
            tipoKardex = 'ENTRADA_COMPRA';
            motivoFinal = motivo_detalle || 'Ingreso de mercadería / Compra';
        } else if (tipo_operacion === 'MERMA') {
            if (stockAnterior < cantNum) {
                await conn.rollback();
                return res.status(400).json({ 
                    error: `No puedes descontar ${cantNum} ${insumo.unidad_medida}. Stock disponible actual: ${stockAnterior} ${insumo.unidad_medida}.` 
                });
            }
            stockNuevo = stockAnterior - cantNum;
            tipoKardex = 'SALIDA_MERMA';
            motivoFinal = motivo_detalle || 'Merma declarada';

            // Insertar también en tabla mermas
            await conn.query(`
                INSERT INTO mermas (insumo_id, usuario_id, cantidad, motivo, comentario)
                VALUES (?, ?, ?, 'DETERIORO', ?)
            `, [id, req.usuario.id, cantNum, motivoFinal]);
        } else { // Descuento o corrección
            if (stockAnterior < cantNum) {
                await conn.rollback();
                return res.status(400).json({ 
                    error: `No puedes descontar ${cantNum} ${insumo.unidad_medida}. Stock actual: ${stockAnterior} ${insumo.unidad_medida}.` 
                });
            }
            stockNuevo = stockAnterior - cantNum;
            tipoKardex = 'AJUSTE_NEGATIVO';
            motivoFinal = motivo_detalle || 'Corrección / Salida de inventario';
        }

        await conn.query(`UPDATE insumos SET stock_actual = ? WHERE id = ?`, [stockNuevo, id]);

        await conn.query(`
            INSERT INTO kardex (insumo_id, usuario_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, costo_unitario, motivo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, req.usuario.id, tipoKardex, cantNum, stockAnterior, stockNuevo, insumo.costo_unitario, motivoFinal]);

        await conn.commit();
        io.emit('STOCK_ACTUALIZADO', { 
            insumos_afectados: [Number(id)],
            insumo_id: Number(id),
            stock_nuevo: stockNuevo,
            insumo_nombre: insumo.nombre
        });
        res.json({
            message: `Kardex registrado con éxito. Nuevo stock: ${stockNuevo.toFixed(2)} ${insumo.unidad_medida}`,
            stock_nuevo: stockNuevo,
            insumo_id: Number(id)
        });

    } catch (err) {
        await conn.rollback();
        console.error('Error ajustando Kardex:', err);
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

// ══════════════════════════════════════════════════════════════
// RUTAS DE CLIENTES: BÚSQUEDA INSTANTÁNEA Y REGISTRO AUTOMATIZADO
// ══════════════════════════════════════════════════════════════

// GET /api/clientes/todos — Catálogo precargado de clientes para búsqueda en 0ms
app.get('/api/clientes/todos', verificarToken, async (req, res) => {
    try {
        const [rows] = await poolPromise.query(`
            SELECT id, dni, nombre, visitas 
            FROM clientes 
            ORDER BY visitas DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/clientes/buscar?doc=72839401 — Búsqueda instantánea con validación y promoción
app.get('/api/clientes/buscar', verificarToken, async (req, res) => {
    const doc = (req.query.doc || '').replace(/\D/g, '').trim();
    if (!doc || (doc.length !== 8 && doc.length !== 11)) {
        return res.json({ cliente: null, encontrado: false, promo_disponible: false });
    }

    try {
        const [rows] = await poolPromise.query(`
            SELECT id, dni, nombre, visitas
            FROM clientes
            WHERE dni = ?
            LIMIT 1
        `, [doc]);

        if (rows.length > 0) {
            const cliente = rows[0];
            const cantVisitas = Number(cliente.visitas) || 1;
            const tieneDescuento = cantVisitas >= 5;

            res.json({
                cliente: {
                    id: cliente.id,
                    dni: cliente.dni,
                    nombre: cliente.nombre,
                    visitas: cantVisitas,
                    // Alias de compatibilidad
                    numero_documento: cliente.dni,
                    nombre_completo: cliente.nombre,
                    total_visitas: cantVisitas,
                    tiene_promo: tieneDescuento,
                    descuento_porcentaje: tieneDescuento ? 20 : 0
                },
                encontrado: true,
                promo_disponible: tieneDescuento,
                descuento_porcentaje: tieneDescuento ? 20 : 0
            });
        } else {
            res.json({ cliente: null, encontrado: false, promo_disponible: false });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/clientes/auto-registrar — Guardado/Actualización transparente al cobrar
app.post('/api/clientes/auto-registrar', verificarToken, async (req, res) => {
    const { dni, numero_documento, nombre, nombre_completo } = req.body;
    const doc = (dni || numero_documento || '').replace(/\D/g, '').trim();
    const nom = (nombre || nombre_completo || '').trim();

    // Validaciones estrictas: no registrar DNI erróneo o genérico
    if (!doc || !nom || nom === 'PÚBLICO GENERAL') {
        return res.json({ status: 'ignored', message: 'Cliente general o sin documento' });
    }

    if (doc.length !== 8 && doc.length !== 11) {
        return res.status(400).json({ error: 'El documento debe tener 8 (DNI) u 11 (RUC) dígitos.' });
    }

    try {
        const [existente] = await poolPromise.query(`SELECT id, dni, nombre, visitas FROM clientes WHERE dni = ? LIMIT 1`, [doc]);

        if (existente.length > 0) {
            // Cliente existente: preservar identidad registrada y sumar visita
            await poolPromise.query(`
                UPDATE clientes 
                SET visitas = visitas + 1, updated_at = NOW()
                WHERE id = ?
            `, [existente[0].id]);
            res.json({ status: 'updated', id: existente[0].id, cliente: existente[0] });
        } else {
            // Insertar nuevo cliente automáticamente con 1 visita
            const [result] = await poolPromise.query(`
                INSERT INTO clientes (dni, nombre, visitas)
                VALUES (?, ?, 1)
            `, [doc, nom]);
            res.json({ status: 'created', id: result.insertId });
        }
    } catch (err) {
        console.error('Error auto-registrando cliente:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/kardex — Ver movimientos del Libro Mayor
app.get('/api/admin/kardex', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const [rows] = await poolPromise.query(`
            SELECT k.*, i.nombre as insumo_nombre, i.unidad_medida, u.nombre as usuario_nombre
            FROM kardex k
            JOIN insumos i ON k.insumo_id = i.id
            JOIN usuarios u ON k.usuario_id = u.id
            WHERE k.tipo_movimiento != 'ENTRADA_DEVOLUCION_COMANDA'
              AND k.motivo NOT LIKE '%cambio de plato%'
            ORDER BY k.fecha_hora DESC
            LIMIT 200
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/recetas — Ver escandallos
app.get('/api/admin/recetas', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const [rows] = await poolPromise.query(`
            SELECT r.*, p.nombre as producto_nombre, i.nombre as insumo_nombre, i.unidad_medida
            FROM recetas_detalles r
            JOIN productos p ON r.producto_id = p.id
            JOIN insumos i ON r.insumo_id = i.id
            ORDER BY p.nombre, i.nombre
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/consumo-platos?fecha=YYYY-MM-DD — Total de consumo por plato e insumos
app.get('/api/admin/consumo-platos', verificarToken, verificarAdmin, async (req, res) => {
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];
    try {
        // 1. Platos consumidos / pedidos en la fecha
        const [platosConsumidos] = await poolPromise.query(`
            SELECT 
                p.id as producto_id,
                p.nombre as producto_nombre,
                c.nombre as categoria_nombre,
                p.precio as precio_unitario,
                SUM(dp.cantidad) as total_pedidos,
                SUM(dp.cantidad * p.precio) as total_recaudado,
                COUNT(DISTINCT dp.pedido_id) as cantidad_mesas
            FROM detalles_pedido dp
            JOIN productos p ON dp.producto_id = p.id
            JOIN categorias c ON p.categoria_id = c.id
            JOIN pedidos ped ON dp.pedido_id = ped.id
            WHERE DATE(ped.fecha_hora) = ?
            GROUP BY p.id, p.nombre, c.nombre, p.precio
            ORDER BY total_pedidos DESC, total_recaudado DESC
        `, [fecha]);

        // 2. Desglose de insumos consumidos por plato en la fecha
        const [insumosPorPlato] = await poolPromise.query(`
            SELECT 
                p.id as producto_id,
                i.id as insumo_id,
                i.nombre as insumo_nombre,
                i.unidad_medida,
                i.costo_unitario,
                SUM(dp.cantidad * rd.cantidad_requerida) as total_insumo_gastado,
                SUM(dp.cantidad * rd.cantidad_requerida * i.costo_unitario) as costo_total
            FROM detalles_pedido dp
            JOIN pedidos ped ON dp.pedido_id = ped.id
            JOIN productos p ON dp.producto_id = p.id
            JOIN recetas_detalles rd ON rd.producto_id = p.id
            JOIN insumos i ON rd.insumo_id = i.id
            WHERE DATE(ped.fecha_hora) = ?
            GROUP BY p.id, i.id, i.nombre, i.unidad_medida, i.costo_unitario
            ORDER BY p.id, total_insumo_gastado DESC
        `, [fecha]);

        // 3. Insumos globales consumidos en la fecha
        const [insumosGlobales] = await poolPromise.query(`
            SELECT 
                i.id as insumo_id,
                i.codigo as insumo_codigo,
                i.nombre as insumo_nombre,
                i.unidad_medida,
                i.stock_actual,
                i.costo_unitario,
                SUM(dp.cantidad * rd.cantidad_requerida) as total_consumido,
                SUM(dp.cantidad * rd.cantidad_requerida * i.costo_unitario) as costo_total_gastado
            FROM detalles_pedido dp
            JOIN pedidos ped ON dp.pedido_id = ped.id
            JOIN recetas_detalles rd ON rd.producto_id = dp.producto_id
            JOIN insumos i ON rd.insumo_id = i.id
            WHERE DATE(ped.fecha_hora) = ?
            GROUP BY i.id, i.codigo, i.nombre, i.unidad_medida, i.stock_actual, i.costo_unitario
            ORDER BY total_consumido DESC
        `, [fecha]);

        // Mapear insumos a cada plato
        const insumosMap = {};
        insumosPorPlato.forEach(ins => {
            if (!insumosMap[ins.producto_id]) insumosMap[ins.producto_id] = [];
            insumosMap[ins.producto_id].push(ins);
        });

        const platosConInsumos = platosConsumidos.map(p => ({
            ...p,
            insumos_consumidos: insumosMap[p.producto_id] || []
        }));

        res.json({
            fecha,
            platos: platosConInsumos,
            insumos_globales: insumosGlobales,
            total_unidades: platosConsumidos.reduce((acc, p) => acc + Number(p.total_pedidos), 0),
            total_dinero: platosConsumidos.reduce((acc, p) => acc + Number(p.total_recaudado), 0)
        });

    } catch (err) {
        console.error('Error calculando consumo por plato:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/cambiar-plato — Autorización y gestión administrativa de cambio de plato
app.post('/api/admin/cambiar-plato', verificarToken, async (req, res) => {
    // Solo Administrador o Cajero autorizado
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'cajero') {
        return res.status(403).json({ error: 'Solo la Administración o Supervisión de Caja puede autorizar cambios de plato.' });
    }

    const { pedido_id, detalle_id, nuevo_producto_id, motivo } = req.body;
    if (!pedido_id || !detalle_id || !nuevo_producto_id || !motivo) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para el cambio de plato.' });
    }

    const conn = await poolPromise.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Bloqueo de pedido
        const [pedidos] = await conn.query(`
            SELECT p.*, m.nombre as mesa_nombre 
            FROM pedidos p 
            LEFT JOIN mesas m ON p.mesa_id = m.id 
            WHERE p.id = ? FOR UPDATE
        `, [pedido_id]);

        if (pedidos.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Pedido no encontrado.' });
        }
        const pedido = pedidos[0];
        if (pedido.estado_global !== 'Abierto') {
            await conn.rollback();
            return res.status(400).json({ error: 'Solo se pueden cambiar platos en comandas abiertas.' });
        }

        // 2. Bloqueo de detalle de comanda a cambiar
        const [detalles] = await conn.query(`
            SELECT dp.*, p.nombre as producto_nombre, p.precio as producto_precio, p.tipo_producto, p.insumo_directo_id
            FROM detalles_pedido dp
            JOIN productos p ON dp.producto_id = p.id
            WHERE dp.id = ? AND dp.pedido_id = ?
            FOR UPDATE
        `, [detalle_id, pedido_id]);

        if (detalles.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Item de pedido no encontrado.' });
        }
        const detalleAnterior = detalles[0];
        const cantCambio = Number(detalleAnterior.cantidad);

        // 3. Obtener información del nuevo plato
        const [nuevos] = await conn.query(`SELECT * FROM productos WHERE id = ?`, [nuevo_producto_id]);
        if (nuevos.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Nuevo producto no encontrado.' });
        }
        const nuevoProd = nuevos[0];

        const precioAnteriorTotal = parseFloat(detalleAnterior.producto_precio) * cantCambio;
        const precioNuevoTotal = parseFloat(nuevoProd.precio) * cantCambio;
        const diferenciaPrecio = precioNuevoTotal - precioAnteriorTotal;

        // 4. Gestión de Insumos & Cocina
        // A) Insumos del plato anterior (directo + recetas)
        const insumosAnteriores = [];
        if (detalleAnterior.tipo_producto === 'DIRECTO' && detalleAnterior.insumo_directo_id) {
            insumosAnteriores.push({ insumo_id: detalleAnterior.insumo_directo_id, cantidad: cantCambio });
        }
        const [recetasAnterior] = await conn.query(`
            SELECT rd.*, i.nombre as insumo_nombre, i.costo_unitario, i.stock_actual, i.unidad_medida
            FROM recetas_detalles rd
            JOIN insumos i ON rd.insumo_id = i.id
            WHERE rd.producto_id = ?
        `, [detalleAnterior.producto_id]);
        recetasAnterior.forEach(r => {
            insumosAnteriores.push({ insumo_id: r.insumo_id, cantidad: Number(r.cantidad_requerida) * cantCambio });
        });

        // B) Insumos del nuevo plato (directo + recetas)
        const insumosNuevos = [];
        if (nuevoProd.tipo_producto === 'DIRECTO' && nuevoProd.insumo_directo_id) {
            insumosNuevos.push({ insumo_id: nuevoProd.insumo_directo_id, cantidad: cantCambio });
        }
        const [recetasNuevo] = await conn.query(`
            SELECT rd.*, i.nombre as insumo_nombre, i.costo_unitario, i.stock_actual, i.unidad_medida
            FROM recetas_detalles rd
            JOIN insumos i ON rd.insumo_id = i.id
            WHERE rd.producto_id = ?
        `, [nuevo_producto_id]);
        recetasNuevo.forEach(r => {
            insumosNuevos.push({ insumo_id: r.insumo_id, cantidad: Number(r.cantidad_requerida) * cantCambio });
        });

        let fueMermaCocina = false;

        // A) Si el plato anterior estaba PENDIENTE (cocina aún NO lo preparó):
        // Reintegrar insumos al Almacén Y ASENTAR EN KARDEX COMO ENTRADA_DEVOLUCION
        if (detalleAnterior.estado_cocina === 'Pendiente') {
            for (const item of insumosAnteriores) {
                const [insDb] = await conn.query(`SELECT stock_actual, costo_unitario, nombre FROM insumos WHERE id = ? FOR UPDATE`, [item.insumo_id]);
                if (insDb.length > 0) {
                    const stockAnt = Number(insDb[0].stock_actual);
                    const stockNuev = stockAnt + item.cantidad;
                    await conn.query(`UPDATE insumos SET stock_actual = ? WHERE id = ?`, [stockNuev, item.insumo_id]);
                    await conn.query(`
                        INSERT INTO kardex (insumo_id, usuario_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, costo_unitario, referencia_id, motivo)
                        VALUES (?, ?, 'ENTRADA_DEVOLUCION', ?, ?, ?, ?, ?, ?)
                    `, [
                        item.insumo_id,
                        req.usuario.id,
                        item.cantidad,
                        stockAnt,
                        stockNuev,
                        insDb[0].costo_unitario,
                        pedido_id,
                        `Devolución a almacén: Plato no preparado cambiado '${detalleAnterior.producto_nombre}' (Pedido #${pedido_id}, Mesa ${pedido.mesa_nombre || 'Mesa'})`
                    ]);
                }
            }
        } else {
            // Si ya estaba preparándose o listo: Se declara MERMA de cocina
            fueMermaCocina = true;
            for (const item of insumosAnteriores) {
                await conn.query(`
                    INSERT INTO mermas (insumo_id, usuario_id, cantidad, motivo, comentario)
                    VALUES (?, ?, ?, 'DETERIORO', ?)
                `, [
                    item.insumo_id, req.usuario.id, item.cantidad,
                    `Merma por cambio de plato en mesa (${detalleAnterior.producto_nombre} cambiado por ${nuevoProd.nombre}): ${motivo}`
                ]);
            }
        }

        // B) Para el NUEVO plato: descontar sus insumos de almacén Y ASENTAR EN KARDEX COMO SALIDA_VENTA
        for (const item of insumosNuevos) {
            const [insDb] = await conn.query(`SELECT stock_actual, costo_unitario, nombre FROM insumos WHERE id = ? FOR UPDATE`, [item.insumo_id]);
            if (insDb.length > 0) {
                const stockAnt = Number(insDb[0].stock_actual);
                const stockNuev = stockAnt - item.cantidad;
                await conn.query(`UPDATE insumos SET stock_actual = ? WHERE id = ?`, [stockNuev, item.insumo_id]);
                await conn.query(`
                    INSERT INTO kardex (insumo_id, usuario_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, costo_unitario, referencia_id, motivo)
                    VALUES (?, ?, 'SALIDA_VENTA', ?, ?, ?, ?, ?, ?)
                `, [
                    item.insumo_id,
                    req.usuario.id,
                    item.cantidad,
                    stockAnt,
                    stockNuev,
                    insDb[0].costo_unitario,
                    pedido_id,
                    `Salida por cambio de plato en comanda '${nuevoProd.nombre}' (Pedido #${pedido_id}, Mesa ${pedido.mesa_nombre || 'Mesa'})`
                ]);
            }
        }

        // 5. Actualizar comanda: modificar el detalle
        const nuevaNota = `🔄 [CAMBIO AUTORIZADO]: Reemplaza a ${detalleAnterior.producto_nombre}. Motivo: ${motivo}`;
        await conn.query(`
            UPDATE detalles_pedido 
            SET producto_id = ?, notas_cocina = ?, estado_cocina = 'Pendiente'
            WHERE id = ?
        `, [nuevo_producto_id, nuevaNota, detalle_id]);

        // 6. Recalcular total del pedido
        const nuevoTotalPedido = Math.max(0, parseFloat(pedido.total) + diferenciaPrecio);
        await conn.query(`UPDATE pedidos SET total = ?, version = version + 1 WHERE id = ?`, [nuevoTotalPedido, pedido_id]);

        // 7. Registrar auditoría en tabla cambios_platos
        await conn.query(`
            INSERT INTO cambios_platos 
            (pedido_id, mesa_nombre, usuario_id, usuario_nombre, producto_anterior_id, producto_anterior_nombre, producto_nuevo_id, producto_nuevo_nombre, precio_anterior, precio_nuevo, diferencia, motivo, fue_merma_cocina)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            pedido_id,
            pedido.mesa_nombre || 'Mesa',
            req.usuario.id,
            req.usuario.nombre,
            detalleAnterior.producto_id,
            detalleAnterior.producto_nombre,
            nuevoProd.id,
            nuevoProd.nombre,
            detalleAnterior.producto_precio,
            nuevoProd.precio,
            diferenciaPrecio,
            motivo,
            fueMermaCocina
        ]);

        await conn.commit();

        // 8. Notificaciones en Tiempo Real vía Socket.io
        io.emit('CAMBIO_PLATO_COMANDA', {
            pedido_id,
            mesa: pedido.mesa_nombre || 'Mesa',
            autorizado_por: req.usuario.nombre,
            anterior: detalleAnterior.producto_nombre,
            nuevo: nuevoProd.nombre,
            diferencia: diferenciaPrecio,
            motivo,
            fue_merma: fueMermaCocina
        });
        io.emit('CAMBIO_MESAS', { mesa_id: pedido.mesa_id });
        io.emit('NUEVA_COMANDA', { pedido_id, mesa: pedido.mesa_nombre, tipo: 'cambio' });
        const insumosAfectadosIds = [...insumosAnteriores.map(i => i.insumo_id), ...insumosNuevos.map(i => i.insumo_id)];
        io.emit('STOCK_ACTUALIZADO', { insumos_afectados: insumosAfectadosIds });

        res.json({
            message: `Plato '${detalleAnterior.producto_nombre}' cambiado con éxito por '${nuevoProd.nombre}'. ${detalleAnterior.estado_cocina === 'Pendiente' ? 'Insumos reintegrados al Kardex.' : 'Se registró merma por cocción en proceso.'}`,
            diferencia: diferenciaPrecio,
            nuevo_total: nuevoTotalPedido,
            fue_merma: fueMermaCocina
        });

    } catch (err) {
        await conn.rollback();
        console.error('Error procesando cambio de plato:', err);
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

// POST /api/admin/cancelar-plato-detalle — Anular / Cancelar un plato de comanda con devolución estricta a Kardex
app.post('/api/admin/cancelar-plato-detalle', verificarToken, async (req, res) => {
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'cajero') {
        return res.status(403).json({ error: 'Solo la Administración o Supervisión de Caja puede anular platos de una comanda.' });
    }

    const { pedido_id, detalle_id, motivo } = req.body;
    if (!pedido_id || !detalle_id || !motivo) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para anular el plato.' });
    }

    const conn = await poolPromise.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Bloqueo de pedido
        const [pedidos] = await conn.query(`
            SELECT p.*, m.nombre as mesa_nombre 
            FROM pedidos p 
            LEFT JOIN mesas m ON p.mesa_id = m.id 
            WHERE p.id = ? FOR UPDATE
        `, [pedido_id]);

        if (pedidos.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Pedido no encontrado.' });
        }
        const pedido = pedidos[0];
        if (pedido.estado_global !== 'Abierto') {
            await conn.rollback();
            return res.status(400).json({ error: 'Solo se pueden anular platos en comandas abiertas.' });
        }

        // 2. Bloqueo de detalle de comanda
        const [detalles] = await conn.query(`
            SELECT dp.*, p.nombre as producto_nombre, p.precio as producto_precio, p.tipo_producto, p.insumo_directo_id
            FROM detalles_pedido dp
            JOIN productos p ON dp.producto_id = p.id
            WHERE dp.id = ? AND dp.pedido_id = ?
            FOR UPDATE
        `, [detalle_id, pedido_id]);

        if (detalles.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Item de comanda no encontrado.' });
        }
        const detalle = detalles[0];
        const cant = Number(detalle.cantidad);

        // 3. Obtener insumos del plato (directos + recetas)
        const insumosADevolver = [];
        if (detalle.tipo_producto === 'DIRECTO' && detalle.insumo_directo_id) {
            insumosADevolver.push({ insumo_id: detalle.insumo_directo_id, cantidad: cant });
        }
        const [recetas] = await conn.query(`
            SELECT rd.*, i.nombre as insumo_nombre, i.costo_unitario, i.stock_actual
            FROM recetas_detalles rd
            JOIN insumos i ON rd.insumo_id = i.id
            WHERE rd.producto_id = ?
        `, [detalle.producto_id]);

        recetas.forEach(r => {
            insumosADevolver.push({ insumo_id: r.insumo_id, cantidad: cant * Number(r.cantidad_requerida) });
        });

        let fueMerma = false;

        // Si estaba Pendiente (no cocinado): DEVOLVER A KARDEX Y ALMACEN
        if (detalle.estado_cocina === 'Pendiente') {
            for (const item of insumosADevolver) {
                const [insDb] = await conn.query(`SELECT stock_actual, costo_unitario, nombre FROM insumos WHERE id = ? FOR UPDATE`, [item.insumo_id]);
                if (insDb.length > 0) {
                    const stockAnt = Number(insDb[0].stock_actual);
                    const stockNuev = stockAnt + item.cantidad;
                    await conn.query(`UPDATE insumos SET stock_actual = ? WHERE id = ?`, [stockNuev, item.insumo_id]);
                    await conn.query(`
                        INSERT INTO kardex (insumo_id, usuario_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, costo_unitario, referencia_id, motivo)
                        VALUES (?, ?, 'ENTRADA_DEVOLUCION', ?, ?, ?, ?, ?, ?)
                    `, [
                        item.insumo_id,
                        req.usuario.id,
                        item.cantidad,
                        stockAnt,
                        stockNuev,
                        insDb[0].costo_unitario,
                        pedido_id,
                        `Devolución a almacén: Plato cancelado sin cocinar '${detalle.producto_nombre}' (Comanda #${pedido_id}, Mesa ${pedido.mesa_nombre || 'Mesa'})`
                    ]);
                }
            }
        } else {
            // Ya estaba en cocina / cocinado -> Registrar MERMA
            fueMerma = true;
            for (const item of insumosADevolver) {
                await conn.query(`
                    INSERT INTO mermas (insumo_id, usuario_id, cantidad, motivo, comentario)
                    VALUES (?, ?, ?, 'DETERIORO', ?)
                `, [
                    item.insumo_id,
                    req.usuario.id,
                    item.cantidad,
                    `Merma por plato cancelado en cocina (${detalle.producto_nombre}): ${motivo}`
                ]);
            }
        }

        // Eliminar detalle de comanda
        await conn.query(`DELETE FROM detalles_pedido WHERE id = ?`, [detalle_id]);

        // Recalcular total de pedido
        const montoRestar = parseFloat(detalle.producto_precio) * cant;
        const nuevoTotal = Math.max(0, parseFloat(pedido.total) - montoRestar);

        // Verificar si quedan detalles en la comanda
        const [detallesRestantes] = await conn.query(`SELECT COUNT(*) as cant FROM detalles_pedido WHERE pedido_id = ?`, [pedido_id]);
        if (detallesRestantes[0].cant === 0) {
            // Si la comanda quedó vacía, cancelar el pedido y liberar la mesa
            await conn.query(`UPDATE pedidos SET total = 0, estado_global = 'Cancelado', version = version + 1 WHERE id = ?`, [pedido_id]);
            if (pedido.mesa_id) {
                await conn.query(`UPDATE mesas SET estado = 'Libre' WHERE id = ?`, [pedido.mesa_id]);
            }
        } else {
            await conn.query(`UPDATE pedidos SET total = ?, version = version + 1 WHERE id = ?`, [nuevoTotal, pedido_id]);
        }

        // Registrar auditoría en cambios_platos
        await conn.query(`
            INSERT INTO cambios_platos 
            (pedido_id, mesa_nombre, usuario_id, usuario_nombre, producto_anterior_id, producto_anterior_nombre, producto_nuevo_id, producto_nuevo_nombre, precio_anterior, precio_nuevo, diferencia, motivo, fue_merma_cocina)
            VALUES (?, ?, ?, ?, ?, ?, NULL, 'CANCELADO / ANULADO', ?, 0, ?, ?, ?)
        `, [
            pedido_id,
            pedido.mesa_nombre || 'Mesa',
            req.usuario.id,
            req.usuario.nombre,
            detalle.producto_id,
            detalle.producto_nombre,
            detalle.producto_precio,
            -montoRestar,
            `[ANULACIÓN / DEVOLUCIÓN]: ${motivo}`,
            fueMerma
        ]);

        await conn.commit();

        // Notificaciones en tiempo real
        io.emit('CAMBIO_PLATO_COMANDA', {
            pedido_id,
            mesa: pedido.mesa_nombre || 'Mesa',
            autorizado_por: req.usuario.nombre,
            anterior: detalle.producto_nombre,
            nuevo: 'CANCELADO / DEVUELTO',
            diferencia: -montoRestar,
            motivo,
            fue_merma: fueMerma
        });
        if (pedido.mesa_id && detallesRestantes[0].cant === 0) {
            io.emit('CAMBIO_MESAS', { mesa_id: pedido.mesa_id, estado: 'Libre' });
        }
        io.emit('NUEVA_COMANDA', { pedido_id, mesa: pedido.mesa_nombre, tipo: 'cancelado' });
        io.emit('STOCK_ACTUALIZADO', { insumos_afectados: insumosADevolver.map(i => i.insumo_id) });

        res.json({
            message: `Plato '${detalle.producto_nombre}' cancelado exitosamente. ${detalle.estado_cocina === 'Pendiente' ? '✅ Insumos reintegrados a almacén y Kardex.' : '⚠️ Se registró merma por estar en preparación.'}`,
            diferencia: -montoRestar,
            nuevo_total: nuevoTotal,
            comanda_cancelada: detallesRestantes[0].cant === 0,
            fue_merma: fueMerma
        });

    } catch (err) {
        await conn.rollback();
        console.error('Error cancelando plato:', err);
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

// GET /api/admin/cambios-platos — Historial de auditoría de cambios de plato
app.get('/api/admin/cambios-platos', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const [rows] = await poolPromise.query(`
            SELECT * FROM cambios_platos 
            ORDER BY created_at DESC 
            LIMIT 100
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ══════════════════════════════════════════════════════════════
// MEJORA 1: STOCK CRÍTICO & FICHA TÉCNICA PARA COCINA
// ══════════════════════════════════════════════════════════════

// GET /api/inventario/stock-critico — Alertas tempranas de insumos bajos o agotados
app.get('/api/inventario/stock-critico', verificarToken, async (req, res) => {
    try {
        const [rows] = await poolPromise.query(`
            SELECT id, codigo, nombre, unidad_medida, stock_actual, stock_minimo, costo_unitario
            FROM insumos
            WHERE stock_actual <= stock_minimo OR stock_actual <= 0
            ORDER BY (stock_actual - stock_minimo) ASC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/cocina/recetas — Fichas técnicas completas para Cocina (en KG/GR/LT/UND)
app.get('/api/cocina/recetas', verificarToken, async (req, res) => {
    try {
        const [rows] = await poolPromise.query(`
            SELECT 
                p.id as producto_id,
                p.nombre as producto_nombre,
                p.precio as producto_precio,
                c.nombre as categoria_nombre,
                rd.cantidad_requerida,
                rd.es_critico,
                i.id as insumo_id,
                i.codigo as insumo_codigo,
                i.nombre as insumo_nombre,
                i.unidad_medida,
                i.stock_actual
            FROM productos p
            JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN recetas_detalles rd ON rd.producto_id = p.id
            LEFT JOIN insumos i ON rd.insumo_id = i.id
            WHERE p.disponible = TRUE
            ORDER BY c.nombre, p.nombre, rd.es_critico DESC, i.nombre
        `);

        // Agrupar por producto
        const recetasAgrupadas = {};
        rows.forEach(r => {
            if (!recetasAgrupadas[r.producto_id]) {
                recetasAgrupadas[r.producto_id] = {
                    producto_id: r.producto_id,
                    nombre: r.producto_nombre,
                    precio: r.producto_precio,
                    categoria: r.categoria_nombre,
                    ingredientes: []
                };
            }
            if (r.insumo_id) {
                recetasAgrupadas[r.producto_id].ingredientes.push({
                    insumo_id: r.insumo_id,
                    codigo: r.insumo_codigo,
                    nombre: r.insumo_nombre,
                    cantidad_unitaria: Number(r.cantidad_requerida),
                    unidad: r.unidad_medida,
                    es_critico: Boolean(r.es_critico),
                    stock_actual: Number(r.stock_actual)
                });
            }
        });

        res.json(Object.values(recetasAgrupadas));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ══════════════════════════════════════════════════════════════
// MEJORA 2 & 3: CONTROL DE PROPINAS PARA MESEROS
// ══════════════════════════════════════════════════════════════

// GET /api/caja/propinas-meseros?fecha=YYYY-MM-DD — Liquidación diaria de propinas
app.get('/api/caja/propinas-meseros', verificarToken, async (req, res) => {
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];
    try {
        const [rows] = await poolPromise.query(`
            SELECT 
                u.id as mesero_id,
                u.nombre as mesero_nombre,
                COUNT(c.id) as cantidad_atenciones,
                COALESCE(SUM(c.propina), 0) as total_propinas,
                COALESCE(SUM(c.total), 0) as total_ventas_atendidas
            FROM comprobantes c
            JOIN pedidos p ON c.pedido_id = p.id
            JOIN usuarios u ON p.usuario_mesero_id = u.id
            WHERE DATE(c.fecha_emision) = ? AND c.propina > 0
            GROUP BY u.id, u.nombre
            ORDER BY total_propinas DESC
        `, [fecha]);

        const [granTotal] = await poolPromise.query(`
            SELECT COALESCE(SUM(propina), 0) as total_general_propinas
            FROM comprobantes
            WHERE DATE(fecha_emision) = ?
        `, [fecha]);

        res.json({
            fecha,
            meseros: rows,
            total_general: granTotal[0]?.total_general_propinas || 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ══════════════════════════════════════════════════════════════
// MEJORA 4: COMPRAS A PROVEEDORES (INGRESO DE MERCADERÍA)
// ══════════════════════════════════════════════════════════════

// GET /api/admin/compras — Historial de compras registradas
app.get('/api/admin/compras', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const [compras] = await poolPromise.query(`
            SELECT 
                cp.*,
                u.nombre as registrado_por,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'insumo_id', cd.insumo_id,
                        'insumo_nombre', i.nombre,
                        'cantidad', cd.cantidad,
                        'unidad_medida', cd.unidad_medida,
                        'costo_unitario', cd.costo_unitario,
                        'subtotal', cd.subtotal
                    )
                ) as items
            FROM compras_proveedores cp
            JOIN usuarios u ON cp.usuario_id = u.id
            LEFT JOIN compras_detalles cd ON cd.compra_id = cp.id
            LEFT JOIN insumos i ON cd.insumo_id = i.id
            GROUP BY cp.id
            ORDER BY cp.fecha_compra DESC, cp.id DESC
            LIMIT 100
        `);

        const parsed = compras.map(c => ({
            ...c,
            items: typeof c.items === 'string' ? JSON.parse(c.items) : (c.items || [])
        }));

        res.json(parsed);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/compras — Registrar compra a proveedor con impacto en Kardex y Costos
app.post('/api/admin/compras', verificarToken, verificarAdmin, async (req, res) => {
    const {
        proveedor_nombre,
        proveedor_ruc = '',
        tipo_comprobante = 'Factura',
        serie_correlativo = '',
        fecha_compra = new Date().toISOString().split('T')[0],
        observaciones = '',
        items = []
    } = req.body;

    if (!proveedor_nombre || !items || items.length === 0) {
        return res.status(400).json({ error: 'Ingresa el nombre del proveedor y al menos un insumo comprado.' });
    }

    const conn = await poolPromise.getConnection();
    try {
        await conn.beginTransaction();

        const totalCompra = items.reduce((acc, it) => acc + (Number(it.cantidad) * Number(it.costo_unitario)), 0);

        // 1. Insertar cabecera de compra
        const [cRes] = await conn.query(`
            INSERT INTO compras_proveedores 
            (proveedor_nombre, proveedor_ruc, tipo_comprobante, serie_correlativo, fecha_compra, total_compra, usuario_id, observaciones)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [proveedor_nombre, proveedor_ruc, tipo_comprobante, serie_correlativo, fecha_compra, totalCompra, req.usuario.id, observaciones]);
        
        const compraId = cRes.insertId;
        const insumosAfectados = [];

        // 2. Procesar cada insumo comprado
        for (const item of items) {
            const cant = Math.abs(Number(item.cantidad));
            const costo = Math.abs(Number(item.costo_unitario));
            const subtotal = cant * costo;

            // Bloqueo pesimista del insumo
            const [insDb] = await conn.query(`SELECT * FROM insumos WHERE id = ? FOR UPDATE`, [item.insumo_id]);
            if (insDb.length > 0) {
                const insumo = insDb[0];
                const stockAnterior = Number(insumo.stock_actual);
                const stockNuevo = stockAnterior + cant;

                // Insertar detalle de compra
                await conn.query(`
                    INSERT INTO compras_detalles (compra_id, insumo_id, cantidad, unidad_medida, costo_unitario, subtotal)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [compraId, item.insumo_id, cant, insumo.unidad_medida, costo, subtotal]);

                // Actualizar stock y costo unitario
                await conn.query(`
                    UPDATE insumos 
                    SET stock_actual = ?, costo_unitario = ?
                    WHERE id = ?
                `, [stockNuevo, costo, item.insumo_id]);

                // Asentar entrada en Kardex
                await conn.query(`
                    INSERT INTO kardex (insumo_id, usuario_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, costo_unitario, referencia_id, motivo)
                    VALUES (?, ?, 'ENTRADA_COMPRA', ?, ?, ?, ?, ?, ?)
                `, [
                    item.insumo_id,
                    req.usuario.id,
                    cant,
                    stockAnterior,
                    stockNuevo,
                    costo,
                    compraId,
                    `Compra #${compraId} - Proveedor: ${proveedor_nombre} (${tipo_comprobante} ${serie_correlativo || ''})`
                ]);

                insumosAfectados.push(item.insumo_id);
            }
        }

        await conn.commit();
        io.emit('STOCK_ACTUALIZADO', { insumos_afectados: insumosAfectados });

        res.json({
            message: `Compra de S/ ${totalCompra.toFixed(2)} registrada exitosamente con impacto en Kardex`,
            compra_id: compraId,
            total: totalCompra
        });

    } catch (err) {
        await conn.rollback();
        console.error('Error registrando compra:', err);
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

// ══════════════════════════════════════════════════════════════
// MEJORA 5: BACKUPS AUTOMATIZADOS DE BASE DE DATOS
// ══════════════════════════════════════════════════════════════

const fs = require('fs');

// Generador de volcado SQL puro en Node
async function generarDumpSQL() {
    const conn = await poolPromise.getConnection();
    try {
        const [tablesRows] = await conn.query('SHOW TABLES');
        const dbName = process.env.DB_NAME || 'sistema_restaurante';
        const tableNames = tablesRows.map(r => Object.values(r)[0]);

        let sql = `-- ========================================================\n`;
        sql += `-- COPIA DE SEGURIDAD AUTOMÁTICA — LA SAZÓN DE DON BIGOTE\n`;
        sql += `-- Base de Datos: ${dbName}\n`;
        sql += `-- Fecha de Creación: ${new Date().toISOString()}\n`;
        sql += `-- Total de Tablas: ${tableNames.length}\n`;
        sql += `-- ========================================================\n\n`;
        sql += `SET FOREIGN_KEY_CHECKS=0;\n\n`;

        for (const table of tableNames) {
            const [createRows] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
            sql += `-- --------------------------------------------------------\n`;
            sql += `-- Estructura de tabla: \`${table}\`\n`;
            sql += `-- --------------------------------------------------------\n`;
            sql += `DROP TABLE IF EXISTS \`${table}\`;\n`;
            sql += `${createRows[0]['Create Table']};\n\n`;

            const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
            if (rows.length > 0) {
                sql += `-- Datos volcados para \`${table}\` (${rows.length} registros)\n`;
                const cols = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
                for (const row of rows) {
                    const vals = Object.values(row).map(v => {
                        if (v === null) return 'NULL';
                        if (typeof v === 'number') return v;
                        if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
                        if (typeof v === 'boolean') return v ? 1 : 0;
                        if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "\\'")}'`;
                        return `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
                    }).join(', ');
                    sql += `INSERT INTO \`${table}\` (${cols}) VALUES (${vals});\n`;
                }
                sql += `\n`;
            }
        }

        sql += `SET FOREIGN_KEY_CHECKS=1;\n`;
        return sql;
    } finally {
        conn.release();
    }
}

// POST /api/admin/backup — Generar Backup instantáneo
app.post('/api/admin/backup', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const backupsDir = path.join(__dirname, 'backups');
        if (!fs.existsSync(backupsDir)) {
            fs.mkdirSync(backupsDir, { recursive: true });
        }

        const now = new Date();
        const stamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `backup_don_bigote_${stamp}.sql`;
        const filePath = path.join(backupsDir, filename);

        const sqlContent = await generarDumpSQL();
        fs.writeFileSync(filePath, sqlContent, 'utf8');

        const stats = fs.statSync(filePath);
        const sizeKb = (stats.size / 1024).toFixed(2);

        res.json({
            message: `Copia de seguridad generada con éxito (${sizeKb} KB)`,
            filename,
            size_kb: sizeKb,
            fecha: now.toLocaleString('es-PE')
        });
    } catch (err) {
        console.error('Error generando backup:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/backups — Listar backups generados
app.get('/api/admin/backups', verificarToken, verificarAdmin, (req, res) => {
    try {
        const backupsDir = path.join(__dirname, 'backups');
        if (!fs.existsSync(backupsDir)) {
            return res.json([]);
        }

        const files = fs.readdirSync(backupsDir)
            .filter(f => f.endsWith('.sql'))
            .map(f => {
                const full = path.join(backupsDir, f);
                const stat = fs.statSync(full);
                return {
                    filename: f,
                    size_kb: (stat.size / 1024).toFixed(2),
                    fecha: stat.mtime.toLocaleString('es-PE'),
                    timestamp: stat.mtime.getTime()
                };
            })
            .sort((a, b) => b.timestamp - a.timestamp);

        res.json(files);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/backups/:filename — Descargar archivo SQL
app.get('/api/admin/backups/:filename', verificarToken, verificarAdmin, (req, res) => {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(__dirname, 'backups', filename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Archivo de backup no encontrado.' });
    }
    res.download(filePath, filename);
});

// ══════════════════════════════════════════════════════════════
// RUTAS DE ADMINISTRADOR (ELIMINAR BOLETAS & REPORTES)
// ══════════════════════════════════════════════════════════════

// DELETE /api/admin/comprobantes/:id — ELIMINAR / ANULAR BOLETA
app.delete('/api/admin/comprobantes/:id', verificarToken, verificarAdmin, (req, res) => {
    const { id } = req.params;
    pool.query(`DELETE FROM comprobantes WHERE id = ?`, [id], (err) => {
        if (err) return res.status(500).json({ error: `Error eliminando boleta: ${err.message}` });
        res.json({ message: 'Boleta eliminada correctamente' });
    });
});

// GET /api/admin/ventas-por-fecha — Reporte por fecha
app.get('/api/admin/ventas-por-fecha', verificarToken, verificarAdmin, (req, res) => {
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];

    const statsSQL = `
        SELECT 
            COALESCE(SUM(total), 0) as ventas_totales,
            COUNT(*) as comprobantes_totales,
            COALESCE(SUM(CASE WHEN metodo_pago = 'Efectivo' THEN total ELSE 0 END), 0) as total_efectivo,
            COALESCE(SUM(CASE WHEN metodo_pago IN ('Yape', 'Plin') THEN total ELSE 0 END), 0) as total_yape,
            COALESCE(SUM(CASE WHEN metodo_pago = 'Tarjeta' THEN total ELSE 0 END), 0) as total_tarjeta
        FROM comprobantes
        WHERE DATE(fecha_emision) = ?
    `;

    const comprobantesSQL = `
        SELECT 
            c.id,
            c.serie_correlativo,
            c.tipo_comprobante,
            c.doc_cliente,
            c.nombre_cliente,
            c.metodo_pago,
            c.monto_recibido,
            c.vuelto,
            c.total,
            TIME_FORMAT(c.fecha_emision, '%H:%i') as hora,
            DATE_FORMAT(c.fecha_emision, '%d/%m/%Y') as fecha,
            p.nombre_cliente as mesero,
            COALESCE(m.nombre, 'Llevar/Delivery') as mesa
        FROM comprobantes c
        JOIN pedidos p ON c.pedido_id = p.id
        LEFT JOIN mesas m ON p.mesa_id = m.id
        WHERE DATE(c.fecha_emision) = ?
        ORDER BY c.fecha_emision DESC
    `;

    pool.query(statsSQL, [fecha], (sErr, sRes) => {
        if (sErr) return res.status(500).json({ error: sErr.message });
        pool.query(comprobantesSQL, [fecha], (cErr, cRes) => {
            if (cErr) return res.status(500).json({ error: cErr.message });
            res.json({
                fecha,
                stats: sRes[0] || { ventas_totales: 0, comprobantes_totales: 0, total_efectivo: 0, total_yape: 0, total_tarjeta: 0 },
                comprobantes: cRes
            });
        });
    });
});

// GET /api/admin/usuarios — Usuarios
app.get('/api/admin/usuarios', verificarToken, verificarAdmin, (req, res) => {
    pool.query(`SELECT id, nombre, usuario, rol, activo, created_at FROM usuarios ORDER BY id ASC`, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// POST /api/admin/usuarios — Crear usuario
app.post('/api/admin/usuarios', verificarToken, verificarAdmin, (req, res) => {
    const { nombre, usuario, password, rol = 'mesero' } = req.body;
    if (!nombre || !usuario || !password) return res.status(400).json({ error: 'Campos requeridos.' });

    pool.query(`INSERT INTO usuarios (nombre, usuario, password, rol, activo) VALUES (?, ?, ?, ?, TRUE)`, [nombre, usuario, password, rol], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Usuario creado', id: result.insertId });
    });
});

// PUT /api/admin/usuarios/:id — Editar usuario
app.put('/api/admin/usuarios/:id', verificarToken, verificarAdmin, (req, res) => {
    const { id } = req.params;
    const { nombre, usuario, password, rol } = req.body;
    if (!nombre || !usuario) return res.status(400).json({ error: 'Nombre y usuario requeridos.' });

    if (password && password.trim() !== '') {
        pool.query(`UPDATE usuarios SET nombre = ?, usuario = ?, password = ?, rol = ? WHERE id = ?`, [nombre, usuario, password, rol, id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Usuario actualizado.' });
        });
    } else {
        pool.query(`UPDATE usuarios SET nombre = ?, usuario = ?, rol = ? WHERE id = ?`, [nombre, usuario, rol, id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Usuario actualizado.' });
        });
    }
});

// PUT /api/admin/usuarios/:id/estado — Activar/Desactivar
app.put('/api/admin/usuarios/:id/estado', verificarToken, verificarAdmin, (req, res) => {
    const { id } = req.params;
    const { activo } = req.body;
    pool.query(`UPDATE usuarios SET activo = ?, token_version = token_version + 1 WHERE id = ?`, [activo, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Si fue desactivado, forzar cierre de sesión inmediato
        if (!activo) {
            io.emit('FORZAR_LOGOUT_USUARIO', { usuario_id: Number(id) });
        }

        res.json({ message: 'Estado actualizado.' });
    });
});

// DELETE /api/admin/usuarios/:id — Eliminar usuario
app.delete('/api/admin/usuarios/:id', verificarToken, verificarAdmin, (req, res) => {
    const { id } = req.params;
    // Forzar cierre de sesión primero
    io.emit('FORZAR_LOGOUT_USUARIO', { usuario_id: Number(id) });

    pool.query(`DELETE FROM usuarios WHERE id = ?`, [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Usuario eliminado.' });
    });
});

// GET /api/admin/productos — Ver platos
app.get('/api/admin/productos', verificarToken, verificarAdmin, (req, res) => {
    const query = `
        SELECT p.id, p.nombre, p.precio, p.disponible, c.id as categoria_id, c.nombre as categoria
        FROM productos p
        JOIN categorias c ON p.categoria_id = c.id
        ORDER BY c.nombre, p.nombre
    `;
    pool.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// GET /api/admin/categorias — Ver categorías
app.get('/api/admin/categorias', verificarToken, verificarAdmin, (req, res) => {
    pool.query(`SELECT id, nombre FROM categorias ORDER BY nombre`, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// POST /api/admin/productos — Crear plato
app.post('/api/admin/productos', verificarToken, verificarAdmin, (req, res) => {
    const { nombre, precio, categoria_id } = req.body;
    if (!nombre || !precio || !categoria_id) return res.status(400).json({ error: 'Campos requeridos.' });

    pool.query(`INSERT INTO productos (nombre, precio, categoria_id, disponible) VALUES (?, ?, ?, TRUE)`, [nombre, precio, categoria_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Plato agregado', id: result.insertId });
    });
});

// PUT /api/admin/productos/:id/estado — Disponibilidad
app.put('/api/admin/productos/:id/estado', verificarToken, verificarAdmin, (req, res) => {
    const { id } = req.params;
    const { disponible } = req.body;
    pool.query(`UPDATE productos SET disponible = ? WHERE id = ?`, [disponible, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Disponibilidad actualizada' });
    });
});

// PUT /api/admin/productos/:id — PROCESO CRÍTICO: Editar datos y precio de plato con restricciones
app.put('/api/admin/productos/:id', verificarToken, verificarAdmin, async (req, res) => {
    const { id } = req.params;
    const { nombre, precio, categoria_id } = req.body;

    const conn = await poolPromise.getConnection();
    try {
        // 1. Validar si el restaurante está en turno activo (abierto)
        const [turnos] = await conn.query(`SELECT COUNT(*) as activos FROM turnos_caja WHERE estado = 'Abierto'`);
        if (turnos[0].activos > 0) {
            return res.status(403).json({
                error: 'TURNO_EN_CURSO',
                message: 'No se puede modificar el precio ni datos de los platos mientras haya un turno de caja abierto.'
            });
        }

        // 2. Validar si el plato está en pedidos pendientes/abiertos
        const [pedidosPendientes] = await conn.query(`
            SELECT COUNT(*) as activos 
            FROM detalles_pedido dp
            JOIN pedidos p ON dp.pedido_id = p.id
            WHERE dp.producto_id = ? AND p.estado_global = 'Abierto'
        `, [id]);

        if (pedidosPendientes[0].activos > 0) {
            return res.status(403).json({
                error: 'PLATO_EN_COMANDA_ACTIVA',
                message: 'No se puede editar el plato porque actualmente forma parte de comandas activas sin saldar.'
            });
        }

        // 3. Auditoría del cambio de precio
        const [platoAnterior] = await conn.query(`SELECT * FROM productos WHERE id = ?`, [id]);
        if (platoAnterior.length > 0) {
            await conn.query(`
                INSERT INTO auditoria_eventos (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos)
                VALUES (?, 'MODIFICACION_PRODUCTO', 'productos', ?, ?, ?)
            `, [
                req.usuario.id,
                id,
                JSON.stringify(platoAnterior[0]),
                JSON.stringify({ nombre, precio, categoria_id })
            ]);
        }

        // 4. Actualizar
        await conn.query(`
            UPDATE productos 
            SET nombre = COALESCE(?, nombre), precio = COALESCE(?, precio), categoria_id = COALESCE(?, categoria_id)
            WHERE id = ?
        `, [nombre, precio, categoria_id, id]);

        res.json({ message: 'Plato actualizado correctamente' });

    } catch (err) {
        console.error('Error actualizando producto:', err);
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

// DELETE /api/admin/productos/:id — Eliminar plato
app.delete('/api/admin/productos/:id', verificarToken, verificarAdmin, (req, res) => {
    const { id } = req.params;
    pool.query(`DELETE FROM productos WHERE id = ?`, [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Plato eliminado' });
    });
});

// GET /api/admin/stats — Resumen diario
app.get('/api/admin/stats', verificarToken, (req, res) => {
    const query = `
        SELECT 
            COALESCE(SUM(total), 0) as ventas_hoy,
            COUNT(*) as comprobantes_hoy,
            COALESCE(SUM(CASE WHEN metodo_pago = 'Efectivo' THEN total ELSE 0 END), 0) as total_efectivo,
            COALESCE(SUM(CASE WHEN metodo_pago IN ('Yape', 'Plin') THEN total ELSE 0 END), 0) as total_yape,
            COALESCE(SUM(CASE WHEN metodo_pago = 'Tarjeta' THEN total ELSE 0 END), 0) as total_tarjeta
        FROM comprobantes
        WHERE DATE(fecha_emision) = CURDATE()
    `;
 pool.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0] || { ventas_hoy: 0, comprobantes_hoy: 0, total_efectivo: 0, total_yape: 0, total_tarjeta: 0 });
    });
});

// GET /api/me — Validar sesión activa
app.get('/api/me', verificarToken, (req, res) => {
    res.json({ usuario: req.usuario });
});

// ── Iniciar Servidor ───────────────────────────────────────────

app.use(express.static(path.join(__dirname, 'dist')));

app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return next();
    }

    res.sendFile(
        path.join(__dirname, 'dist', 'index.html'),
        (err) => {
            if (err) next(err);
        }
    );
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Don Bigote ejecutándose con WebSockets (Socket.io) en el puerto ${PORT}`);
});

