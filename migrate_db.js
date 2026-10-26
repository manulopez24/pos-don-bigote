/**
 * MIGRACIÓN ENTERPRISE - LA SAZÓN DE DON BIGOTE
 * Aplica de forma segura e idempotente las nuevas tablas y campos:
 * - Sesiones de usuario (token_version)
 * - Turnos de caja
 * - Insumos y stock
 * - Recetas técnicas (escandallos)
 * - Kardex (libro mayor de inventario)
 * - Mermas y desperdicios
 * - Pagos y auditoría de eventos
 */

const mysql = require('mysql2/promise');

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '1234',
        database: process.env.DB_NAME || 'sistema_restaurante'
    });

    console.log('🔗 Conectado a la base de datos para migración...');

    // Helper para verificar si existe una columna
    async function columnExists(table, column) {
        const [rows] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
        `, [table, column]);
        return rows.length > 0;
    }

    try {
        // 1. Ampliar tabla usuarios
        console.log('1️⃣ Actualizando tabla usuarios...');
        if (!await columnExists('usuarios', 'token_version')) {
            await connection.query('ALTER TABLE usuarios ADD COLUMN token_version INT NOT NULL DEFAULT 1 AFTER activo');
            console.log('   ✅ Columna token_version agregada a usuarios.');
        }
        if (!await columnExists('usuarios', 'telefono')) {
            await connection.query('ALTER TABLE usuarios ADD COLUMN telefono VARCHAR(20) NULL AFTER rol');
            console.log('   ✅ Columna telefono agregada a usuarios.');
        }

        // 2. Crear tabla turnos_caja
        console.log('2️⃣ Creando tabla turnos_caja...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS turnos_caja (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                nombre_turno ENUM('Mañana', 'Tarde') NOT NULL,
                fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_cierre TIMESTAMP NULL,
                monto_inicial DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                monto_final_esperado DECIMAL(10,2) NULL,
                monto_final_real DECIMAL(10,2) NULL,
                estado ENUM('Abierto', 'Cerrado') NOT NULL DEFAULT 'Abierto',
                observaciones TEXT NULL,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('   ✅ Tabla turnos_caja lista.');

        // 3. Crear tabla insumos (inventario materia prima y productos directos)
        console.log('3️⃣ Creando tabla insumos...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS insumos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                codigo VARCHAR(50) NOT NULL UNIQUE,
                nombre VARCHAR(150) NOT NULL,
                descripcion VARCHAR(255) NULL,
                unidad_medida ENUM('KG', 'GR', 'LT', 'ML', 'UND', 'PORCION') NOT NULL,
                stock_actual DECIMAL(12,4) NOT NULL DEFAULT 0.0000,
                stock_minimo DECIMAL(12,4) NOT NULL DEFAULT 0.0000,
                costo_unitario DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
                activo BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('   ✅ Tabla insumos lista.');

        // 4. Ampliar tabla productos
        console.log('4️⃣ Actualizando tabla productos...');
        if (!await columnExists('productos', 'tipo_producto')) {
            await connection.query("ALTER TABLE productos ADD COLUMN tipo_producto ENUM('DIRECTO', 'PREPARADO') NOT NULL DEFAULT 'PREPARADO' AFTER categoria_id");
            console.log('   ✅ Columna tipo_producto agregada a productos.');
        }
        if (!await columnExists('productos', 'insumo_directo_id')) {
            await connection.query('ALTER TABLE productos ADD COLUMN insumo_directo_id INT NULL AFTER tipo_producto');
            await connection.query('ALTER TABLE productos ADD CONSTRAINT fk_productos_insumo_directo FOREIGN KEY (insumo_directo_id) REFERENCES insumos(id) ON DELETE SET NULL');
            console.log('   ✅ Columna insumo_directo_id agregada con foreign key.');
        }
        if (!await columnExists('productos', 'costo_estimado')) {
            await connection.query('ALTER TABLE productos ADD COLUMN costo_estimado DECIMAL(10,2) DEFAULT 0.00 AFTER precio');
            console.log('   ✅ Columna costo_estimado agregada a productos.');
        }

        // 5. Crear tabla recetas_detalles (escandallos)
        console.log('5️⃣ Creando tabla recetas_detalles...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS recetas_detalles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                producto_id INT NOT NULL,
                insumo_id INT NOT NULL,
                cantidad_requerida DECIMAL(12,4) NOT NULL,
                es_critico BOOLEAN NOT NULL DEFAULT TRUE,
                FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
                FOREIGN KEY (insumo_id) REFERENCES insumos(id) ON DELETE RESTRICT,
                UNIQUE KEY uk_receta_producto_insumo (producto_id, insumo_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('   ✅ Tabla recetas_detalles lista.');

        // 6. Crear tabla kardex (libro mayor)
        console.log('6️⃣ Creando tabla kardex...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS kardex (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                insumo_id INT NOT NULL,
                usuario_id INT NOT NULL,
                tipo_movimiento ENUM('ENTRADA_COMPRA', 'SALIDA_VENTA', 'SALIDA_MERMA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'ENTRADA_DEVOLUCION') NOT NULL,
                cantidad DECIMAL(12,4) NOT NULL,
                stock_anterior DECIMAL(12,4) NOT NULL,
                stock_nuevo DECIMAL(12,4) NOT NULL,
                costo_unitario DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
                referencia_id INT NULL,
                motivo VARCHAR(255) NOT NULL,
                fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (insumo_id) REFERENCES insumos(id) ON DELETE RESTRICT,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
                INDEX idx_kardex_insumo_fecha (insumo_id, fecha_hora)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('   ✅ Tabla kardex lista.');

        // 7. Crear tabla mermas
        console.log('7️⃣ Creando tabla mermas...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS mermas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                insumo_id INT NOT NULL,
                usuario_id INT NOT NULL,
                turno_id INT NULL,
                cantidad DECIMAL(12,4) NOT NULL,
                motivo ENUM('VENCIMIENTO', 'DETERIORO', 'ACCIDENTE_COCINA', 'DESCONGELAMIENTO', 'OTRO') NOT NULL,
                comentario TEXT NULL,
                fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (insumo_id) REFERENCES insumos(id) ON DELETE RESTRICT,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
                FOREIGN KEY (turno_id) REFERENCES turnos_caja(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('   ✅ Tabla mermas lista.');

        // 8. Ampliar pedidos
        console.log('8️⃣ Actualizando tabla pedidos...');
        if (!await columnExists('pedidos', 'turno_id')) {
            await connection.query('ALTER TABLE pedidos ADD COLUMN turno_id INT NULL AFTER mesa_id');
            await connection.query('ALTER TABLE pedidos ADD CONSTRAINT fk_pedidos_turno FOREIGN KEY (turno_id) REFERENCES turnos_caja(id) ON DELETE SET NULL');
            console.log('   ✅ Columna turno_id agregada a pedidos.');
        }
        if (!await columnExists('pedidos', 'usuario_mesero_id')) {
            await connection.query('ALTER TABLE pedidos ADD COLUMN usuario_mesero_id INT NULL AFTER turno_id');
            await connection.query('ALTER TABLE pedidos ADD CONSTRAINT fk_pedidos_mesero FOREIGN KEY (usuario_mesero_id) REFERENCES usuarios(id) ON DELETE SET NULL');
            console.log('   ✅ Columna usuario_mesero_id agregada a pedidos.');
        }
        if (!await columnExists('pedidos', 'cerrado_por_usuario_id')) {
            await connection.query('ALTER TABLE pedidos ADD COLUMN cerrado_por_usuario_id INT NULL AFTER usuario_mesero_id');
            await connection.query('ALTER TABLE pedidos ADD CONSTRAINT fk_pedidos_cierre FOREIGN KEY (cerrado_por_usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL');
            console.log('   ✅ Columna cerrado_por_usuario_id agregada a pedidos.');
        }
        if (!await columnExists('pedidos', 'version')) {
            await connection.query('ALTER TABLE pedidos ADD COLUMN version INT NOT NULL DEFAULT 1 AFTER total');
            console.log('   ✅ Columna version agregada a pedidos.');
        }
        if (!await columnExists('pedidos', 'fecha_cierre')) {
            await connection.query('ALTER TABLE pedidos ADD COLUMN fecha_cierre TIMESTAMP NULL AFTER fecha_hora');
            console.log('   ✅ Columna fecha_cierre agregada a pedidos.');
        }

        // 9. Crear tabla pagos (con uk_pedido_pago_unico para prevenir doble cobro)
        console.log('9️⃣ Creando tabla pagos...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS pagos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                pedido_id INT NOT NULL,
                turno_id INT NOT NULL,
                cajero_id INT NOT NULL,
                metodo_pago ENUM('Efectivo', 'Yape', 'Plin', 'Tarjeta_Visa', 'Tarjeta_Mastercard', 'Transferencia') NOT NULL,
                monto DECIMAL(10,2) NOT NULL,
                propina DECIMAL(10,2) DEFAULT 0.00,
                numero_operacion VARCHAR(50) NULL,
                fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE RESTRICT,
                FOREIGN KEY (turno_id) REFERENCES turnos_caja(id) ON DELETE RESTRICT,
                FOREIGN KEY (cajero_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
                UNIQUE KEY uk_pedido_pago_unico (pedido_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('   ✅ Tabla pagos lista.');

        // 10. Crear tabla auditoria_eventos
        console.log('🔟 Creando tabla auditoria_eventos...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS auditoria_eventos (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NULL,
                accion VARCHAR(100) NOT NULL,
                tabla_afectada VARCHAR(50) NOT NULL,
                registro_id INT NULL,
                datos_anteriores JSON NULL,
                datos_nuevos JSON NULL,
                ip_origen VARCHAR(45) NULL,
                fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('   ✅ Tabla auditoria_eventos lista.');

        // 11. Cargar semillas iniciales de insumos y recetas si la tabla está vacía
        console.log('🌱 Verificando insumos iniciales...');
        const [insumosCount] = await connection.query('SELECT COUNT(*) as count FROM insumos');
        if (insumosCount[0].count === 0) {
            console.log('   📦 Insertando insumos base para cebichería...');
            await connection.query(`
                INSERT INTO insumos (codigo, nombre, descripcion, unidad_medida, stock_actual, stock_minimo, costo_unitario) VALUES
                ('INS-PES-001', 'Pescado Corvina Fresco', 'Filete de corvina fresco para ceviche', 'KG', 15.0000, 3.0000, 32.0000),
                ('INS-LIM-002', 'Limón Sutil Piurano', 'Limón fresco para extracción de jugo al momento', 'KG', 10.0000, 2.0000, 6.5000),
                ('INS-CEB-003', 'Cebolla Morada', 'Cebolla corte juliana para ceviche', 'KG', 8.0000, 1.5000, 3.5000),
                ('INS-AJI-004', 'Ají Limo', 'Ají limo fresco picado', 'KG', 2.0000, 0.5000, 12.0000),
                ('INS-CAM-005', 'Camote Glaseado', 'Porciones de camote dulce cocido', 'UND', 40.0000, 10.0000, 0.8000),
                ('INS-CHO-006', 'Choclo Desgranado', 'Choclo tierno desgranado cocido', 'KG', 5.0000, 1.0000, 7.0000),
                ('INS-BEB-001', 'Inca Kola 1L', 'Botella de vidrio / descartable 1L', 'UND', 24.0000, 6.0000, 5.5000),
                ('INS-CER-001', 'Cusqueña Trigo 330ml', 'Cerveza en botella', 'UND', 30.0000, 12.0000, 6.0000),
                ('INS-HEL-001', 'Helado de Vainilla', 'Porción de helado artesanal', 'PORCION', 20.0000, 5.0000, 2.5000);
            `);

            // Vincular productos directos (Bebidas, cervezas, helados)
            await connection.query(`
                UPDATE productos p 
                JOIN insumos i ON (p.nombre = 'Inca Kola 1L' AND i.codigo = 'INS-BEB-001')
                   OR (p.nombre = 'Cusqueña Trigo' AND i.codigo = 'INS-CER-001')
                   OR (p.nombre = 'Helado de Vainilla' AND i.codigo = 'INS-HEL-001')
                SET p.tipo_producto = 'DIRECTO', p.insumo_directo_id = i.id;
            `);

            // Vincular receta para Ceviche Mixto / Clásico si existe
            const [cevicheProd] = await connection.query("SELECT id FROM productos WHERE nombre LIKE '%Ceviche%' LIMIT 1");
            if (cevicheProd.length > 0) {
                const prodId = cevicheProd[0].id;
                await connection.query(`
                    INSERT IGNORE INTO recetas_detalles (producto_id, insumo_id, cantidad_requerida, es_critico)
                    SELECT ?, id, 0.2500, TRUE FROM insumos WHERE codigo = 'INS-PES-001'
                    UNION ALL
                    SELECT ?, id, 0.1500, TRUE FROM insumos WHERE codigo = 'INS-LIM-002'
                    UNION ALL
                    SELECT ?, id, 0.0800, TRUE FROM insumos WHERE codigo = 'INS-CEB-003'
                    UNION ALL
                    SELECT ?, id, 1.0000, FALSE FROM insumos WHERE codigo = 'INS-CAM-005';
                `, [prodId, prodId, prodId, prodId]);
                console.log(`   🍽️ Receta base asignada para producto ID ${prodId} (Ceviche).`);
            }
        }

        console.log('\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE! Toda la estructura Enterprise está lista en MySQL.');

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
    } finally {
        await connection.end();
    }
}

migrate();
