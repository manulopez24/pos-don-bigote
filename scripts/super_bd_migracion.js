const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function migrarSuperBD() {
    console.log('🚀 Iniciando creación de Súper BD e infraestructura para las 5 mejoras...');
    
    // 1. Crear carpeta backups si no existe
    const backupsDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
        console.log('✅ Carpeta backups/ creada exitosamente');
    }

    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '1234',
        database: 'sistema_restaurante'
    });

    try {
        // 2. Agregar columna propina a comprobantes si no existe
        const [columnas] = await conn.query(`SHOW COLUMNS FROM comprobantes LIKE 'propina'`);
        if (columnas.length === 0) {
            await conn.query(`ALTER TABLE comprobantes ADD COLUMN propina DECIMAL(10,2) DEFAULT 0.00 AFTER descuento`);
            console.log('✅ Columna propina agregada a tabla comprobantes');
        }

        // 3. Crear tabla compras_proveedores
        await conn.query(`
            CREATE TABLE IF NOT EXISTS compras_proveedores (
                id INT AUTO_INCREMENT PRIMARY KEY,
                proveedor_nombre VARCHAR(150) NOT NULL,
                proveedor_ruc VARCHAR(20) DEFAULT '',
                tipo_comprobante VARCHAR(50) DEFAULT 'Factura',
                serie_correlativo VARCHAR(50) DEFAULT '',
                fecha_compra DATE NOT NULL,
                total_compra DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                usuario_id INT NOT NULL,
                observaciones TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('✅ Tabla compras_proveedores verificada/creada');

        // 4. Crear tabla compras_detalles
        await conn.query(`
            CREATE TABLE IF NOT EXISTS compras_detalles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                compra_id INT NOT NULL,
                insumo_id INT NOT NULL,
                cantidad DECIMAL(10,3) NOT NULL,
                unidad_medida VARCHAR(20) NOT NULL,
                costo_unitario DECIMAL(10,2) NOT NULL,
                subtotal DECIMAL(10,2) NOT NULL,
                FOREIGN KEY (compra_id) REFERENCES compras_proveedores(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('✅ Tabla compras_detalles verificada/creada');

        // Permitir unidades de medida flexibles en insumos
        await conn.query(`ALTER TABLE insumos MODIFY COLUMN unidad_medida VARCHAR(20) NOT NULL DEFAULT 'KG'`);
        console.log('✅ Columna unidad_medida flexibilizada a VARCHAR(20)');

        // 5. LISTA EXTENSA DE INSUMOS REALES DE CEBICHERÍA PERUANA (en KG, GR, LT, UND)
        const insumosData = [
            // Pescados y Mariscos Frescos
            { codigo: 'INS-PES-001', nombre: 'Pescado Corvina Fresco', desc: 'Filete fresco para ceviches premium', um: 'KG', stock: 25.00, min: 5.00, costo: 32.00 },
            { codigo: 'INS-PES-002', nombre: 'Pescado Lenguado Fresco', desc: 'Filete fino para tiraditos y ceviches de autor', um: 'KG', stock: 12.00, min: 3.00, costo: 45.00 },
            { codigo: 'INS-PES-003', nombre: 'Pescado Bonito Fresco', desc: 'Pescado azul para chicharrones y sudados', um: 'KG', stock: 30.00, min: 8.00, costo: 14.00 },
            { codigo: 'INS-PES-004', nombre: 'Pescado Cabrilla Entero', desc: 'Pescado entero para sudados norteños y fritos', um: 'KG', stock: 18.00, min: 4.00, costo: 22.00 },
            { codigo: 'INS-PES-005', nombre: 'Pescado Jurel Fresco', desc: 'Pescado fresco para frituras y caldos', um: 'KG', stock: 20.00, min: 5.00, costo: 12.00 },
            { codigo: 'INS-MAR-001', nombre: 'Mixtura de Mariscos Fresca', desc: 'Pulpo, calamar, langostino y almejas para arroces y jaleas', um: 'KG', stock: 28.00, min: 6.00, costo: 26.00 },
            { codigo: 'INS-MAR-002', nombre: 'Langostinos Pelados y Desvenados', desc: 'Colitas de langostino para ceviches mixtos y chaufa', um: 'KG', stock: 15.00, min: 4.00, costo: 34.00 },
            { codigo: 'INS-MAR-003', nombre: 'Pulpo Entero Fresco', desc: 'Pulpo entero para cocinar al olivo y parrilla', um: 'KG', stock: 14.00, min: 3.00, costo: 38.00 },
            { codigo: 'INS-MAR-004', nombre: 'Pota Fresca Marina', desc: 'Pota fresca seleccionada para chicharrones', um: 'KG', stock: 25.00, min: 5.00, costo: 8.50 },
            { codigo: 'INS-MAR-005', nombre: 'Conchas de Abanico con Coral', desc: 'Conchas de abanico frescas', um: 'UND', stock: 120.00, min: 30.00, costo: 1.50 },
            { codigo: 'INS-MAR-006', nombre: 'Conchas Negras de Tumbes', desc: 'Conchas negras vivas para ceviche de conchas negras', um: 'DOCENA', stock: 20.00, min: 5.00, costo: 28.00 },
            { codigo: 'INS-MAR-007', nombre: 'Cangrejo Marino Fresco', desc: 'Cangrejos enteros para chilcanos y parihuelas', um: 'UND', stock: 40.00, min: 10.00, costo: 3.50 },
            
            // Cítricos y Verduras
            { codigo: 'INS-VER-001', nombre: 'Limón Sutil Norteño', desc: 'Limón jugoso recién exprimido al momento', um: 'KG', stock: 45.00, min: 10.00, costo: 5.50 },
            { codigo: 'INS-VER-002', nombre: 'Cebolla Roja Seleccionada', desc: 'Cebolla roja cortada en pluma crocante', um: 'KG', stock: 35.00, min: 8.00, costo: 3.20 },
            { codigo: 'INS-VER-003', nombre: 'Ají Limo Fresco', desc: 'Ají limo rojo y amarillo sin pepas', um: 'KG', stock: 8.00, min: 2.00, costo: 12.00 },
            { codigo: 'INS-VER-004', nombre: 'Culantro Fresco', desc: 'Hojas frescas picadas finamente', um: 'KG', stock: 6.00, min: 1.50, costo: 7.00 },
            { codigo: 'INS-VER-005', nombre: 'Apio Fresco Trozado', desc: 'Tallos frescos de apio para base de leche de tigre', um: 'KG', stock: 8.00, min: 2.00, costo: 4.50 },
            { codigo: 'INS-VER-006', nombre: 'Kión (Jengibre) Fresco', desc: 'Kión fresco rallado para saborizante marino', um: 'KG', stock: 5.00, min: 1.00, costo: 9.00 },
            { codigo: 'INS-VER-007', nombre: 'Ajo Fresco Molido', desc: 'Pasta natural de ajo recién molido', um: 'KG', stock: 12.00, min: 3.00, costo: 11.00 },
            { codigo: 'INS-VER-008', nombre: 'Pasta de Ají Amarillo Casero', desc: 'Ají amarillo desvenado y licuado al natural', um: 'KG', stock: 15.00, min: 3.00, costo: 8.00 },
            { codigo: 'INS-VER-009', nombre: 'Pasta de Ají Panca', desc: 'Ají panca especial para parihuelas y sudados', um: 'KG', stock: 10.00, min: 2.00, costo: 9.50 },
            { codigo: 'INS-VER-010', nombre: 'Camote Glaseado / Sancochado', desc: 'Camote dulce amarillo para acompañamiento', um: 'KG', stock: 30.00, min: 6.00, costo: 3.00 },
            { codigo: 'INS-VER-011', nombre: 'Choclo Desgranado Gigante', desc: 'Choclo cusqueño cocido tierno', um: 'KG', stock: 25.00, min: 5.00, costo: 4.80 },
            { codigo: 'INS-VER-012', nombre: 'Yuca Amarilla Para Freír', desc: 'Yuca frita crocante por fuera y suave por dentro', um: 'KG', stock: 35.00, min: 8.00, costo: 3.50 },
            { codigo: 'INS-VER-013', nombre: 'Canchita Serrana Chulpi', desc: 'Maíz tostado al punto crocante', um: 'KG', stock: 20.00, min: 4.00, costo: 8.00 },
            { codigo: 'INS-VER-014', nombre: 'Chicha de Jora Marina', desc: 'Chicha fermentada para sudados y secos', um: 'LT', stock: 15.00, min: 3.00, costo: 4.00 },
            { codigo: 'INS-VER-015', nombre: 'Tomate Italiano', desc: 'Tomates frescos para aderezo y ensaladas criollas', um: 'KG', stock: 15.00, min: 3.00, costo: 3.80 },

            // Abarrotes, Condimentos & Aceites
            { codigo: 'INS-ABA-001', nombre: 'Arroz Extra Añejo', desc: 'Arroz de grano largo graneado para arroces marinos', um: 'KG', stock: 80.00, min: 20.00, costo: 4.20 },
            { codigo: 'INS-ABA-002', nombre: 'Harina de Trigo Especial', desc: 'Harina para apanado de jaleas y chicharrones', um: 'KG', stock: 30.00, min: 8.00, costo: 3.60 },
            { codigo: 'INS-ABA-003', nombre: 'Chuño (Fécula de Maíz)', desc: 'Chuño fino para textura crocante en frituras', um: 'KG', stock: 18.00, min: 4.00, costo: 5.00 },
            { codigo: 'INS-ABA-004', nombre: 'Huevo Fresco de Gallina', desc: 'Huevos de gallina para batidos de frituras', um: 'UND', stock: 90.00, min: 20.00, costo: 0.65 },
            { codigo: 'INS-ABA-005', nombre: 'Aceite Vegetal Premium', desc: 'Aceite vegetal para frituras profundas', um: 'LT', stock: 50.00, min: 12.00, costo: 7.20 },
            { codigo: 'INS-ABA-006', nombre: 'Sillao (Salsa de Soya)', desc: 'Salsa de soya oscura para chaufas y salteados', um: 'LT', stock: 12.00, min: 3.00, costo: 8.50 },
            { codigo: 'INS-ABA-007', nombre: 'Aceite de Ajonjolí', desc: 'Aceite aromático de sésamo para chaufa', um: 'LT', stock: 4.00, min: 1.00, costo: 24.00 },
            { codigo: 'INS-ABA-008', nombre: 'Fondo Concentrado de Pescado', desc: 'Caldo base de cabezas y espinazos para caldos', um: 'LT', stock: 30.00, min: 8.00, costo: 2.00 },
            { codigo: 'INS-ABA-009', nombre: 'Sal Marina Yodada', desc: 'Sal fina para sazón general', um: 'KG', stock: 25.00, min: 5.00, costo: 1.80 },
            { codigo: 'INS-ABA-010', nombre: 'Ajinomoto (Glutamato)', desc: 'Sazonador umami tradicional', um: 'KG', stock: 8.00, min: 2.00, costo: 14.00 },
            { codigo: 'INS-ABA-011', nombre: 'Leche Evaporada', desc: 'Leche evaporada para leche de tigre cremosa y chupes', um: 'LATA', stock: 36.00, min: 8.00, costo: 4.20 },

            // Bebidas directas
            { codigo: 'INS-BEB-001', nombre: 'Cerveza Pilsen Callao 620ml', desc: 'Botella de cerveza Pilsen fría', um: 'UND', stock: 48.00, min: 12.00, costo: 6.50 },
            { codigo: 'INS-BEB-002', nombre: 'Cerveza Cusqueña Trigo 620ml', desc: 'Botella de cerveza Cusqueña Trigo', um: 'UND', stock: 36.00, min: 10.00, costo: 7.20 },
            { codigo: 'INS-BEB-003', nombre: 'Gaseosa Inka Kola 500ml', desc: 'Botella personal Inka Kola', um: 'UND', stock: 60.00, min: 15.00, costo: 2.50 },
            { codigo: 'INS-BEB-004', nombre: 'Gaseosa Coca Cola 500ml', desc: 'Botella personal Coca Cola', um: 'UND', stock: 48.00, min: 12.00, costo: 2.50 },
            { codigo: 'INS-BEB-005', nombre: 'Jarra de Chicha Morada 1L', desc: 'Chicha natural con maíz morado y frutas', um: 'UND', stock: 25.00, min: 5.00, costo: 3.50 },
            { codigo: 'INS-BEB-006', nombre: 'Jarra de Maracuyá 1L', desc: 'Maracuyá natural helado', um: 'UND', stock: 20.00, min: 5.00, costo: 3.50 }
        ];

        // Insertar o actualizar insumos
        for (const ins of insumosData) {
            const [exist] = await conn.query(`SELECT id FROM insumos WHERE codigo = ? OR nombre = ? LIMIT 1`, [ins.codigo, ins.nombre]);
            if (exist.length === 0) {
                const [r] = await conn.query(`
                    INSERT INTO insumos (codigo, nombre, descripcion, unidad_medida, stock_actual, stock_minimo, costo_unitario)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [ins.codigo, ins.nombre, ins.desc, ins.um, ins.stock, ins.min, ins.costo]);
                
                // Kardex saldo inicial
                await conn.query(`
                    INSERT INTO kardex (insumo_id, usuario_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, costo_unitario, motivo)
                    VALUES (?, 1, 'AJUSTE_POSITIVO', ?, 0, ?, ?, 'Inventario Inicial de Super BD')
                `, [r.insertId, ins.stock, ins.stock, ins.costo]);
            } else {
                await conn.query(`
                    UPDATE insumos SET descripcion = ?, unidad_medida = ?, stock_minimo = ?, costo_unitario = ?
                    WHERE id = ?
                `, [ins.desc, ins.um, ins.min, ins.costo, exist[0].id]);
            }
        }
        console.log(`✅ Insumos marinos actualizados e insertados (${insumosData.length} materias primas verificadas)`);

        // Mapear insumos en memoria para recetas
        const [todosInsumos] = await conn.query(`SELECT id, nombre FROM insumos`);
        const insMap = {};
        todosInsumos.forEach(i => { insMap[i.nombre.toLowerCase().trim()] = i.id; });

        // Helper para buscar id de insumo
        function getInsId(nombreParcial) {
            const key = Object.keys(insMap).find(k => k.includes(nombreParcial.toLowerCase()));
            return key ? insMap[key] : null;
        }

        // Obtener productos
        const [todosProductos] = await conn.query(`SELECT id, nombre, categoria_id FROM productos`);

        // RECETAS EXHAUSTIVAS POR PLATO (Cantidades exactas en KG / GR / LT / UND)
        const recetasMaestras = [
            // CEVICHES
            {
                plato: 'Ceviche', // coincide con Ceviche Clásico, Ceviche de Pescado, etc.
                ingredientes: [
                    { insumo: 'pescado corvina', cant: 0.220, critico: 1 }, // 220 gr corvina
                    { insumo: 'limón sutil', cant: 0.150, critico: 1 },      // 150 gr limón
                    { insumo: 'cebolla roja', cant: 0.100, critico: 0 },     // 100 gr cebolla
                    { insumo: 'ají limo', cant: 0.015, critico: 0 },         // 15 gr ají limo
                    { insumo: 'culantro', cant: 0.008, critico: 0 },
                    { insumo: 'camote', cant: 0.120, critico: 0 },           // 120 gr camote
                    { insumo: 'choclo', cant: 0.080, critico: 0 },           // 80 gr choclo
                    { insumo: 'canchita', cant: 0.030, critico: 0 }          // 30 gr canchita
                ]
            },
            {
                plato: 'Ceviche Mixto',
                ingredientes: [
                    { insumo: 'pescado corvina', cant: 0.150, critico: 1 },
                    { insumo: 'mixtura de mariscos', cant: 0.150, critico: 1 },
                    { insumo: 'limón sutil', cant: 0.160, critico: 1 },
                    { insumo: 'cebolla roja', cant: 0.100, critico: 0 },
                    { insumo: 'ají limo', cant: 0.020, critico: 0 },
                    { insumo: 'camote', cant: 0.120, critico: 0 },
                    { insumo: 'choclo', cant: 0.080, critico: 0 }
                ]
            },
            {
                plato: 'Tiradito',
                ingredientes: [
                    { insumo: 'pescado corvina', cant: 0.200, critico: 1 },
                    { insumo: 'limón sutil', cant: 0.120, critico: 1 },
                    { insumo: 'pasta de ají amarillo', cant: 0.060, critico: 1 },
                    { insumo: 'choclo', cant: 0.080, critico: 0 },
                    { insumo: 'camote', cant: 0.100, critico: 0 }
                ]
            },
            {
                plato: 'Leche de Tigre',
                ingredientes: [
                    { insumo: 'pescado corvina', cant: 0.080, critico: 1 },
                    { insumo: 'mixtura de mariscos', cant: 0.060, critico: 1 },
                    { insumo: 'limón sutil', cant: 0.120, critico: 1 },
                    { insumo: 'fondo concentrado', cant: 0.150, critico: 0 },
                    { insumo: 'choclo', cant: 0.050, critico: 0 },
                    { insumo: 'canchita', cant: 0.030, critico: 0 }
                ]
            },
            // CHICHARRONES & JALEAS
            {
                plato: 'Chicharrón de Pescado',
                ingredientes: [
                    { insumo: 'pescado bonito', cant: 0.250, critico: 1 },
                    { insumo: 'harina de trigo', cant: 0.080, critico: 0 },
                    { insumo: 'chuño', cant: 0.040, critico: 0 },
                    { insumo: 'huevo fresco', cant: 1.000, critico: 0 },
                    { insumo: 'aceite vegetal', cant: 0.150, critico: 0 },
                    { insumo: 'yuca amarilla', cant: 0.150, critico: 0 }
                ]
            },
            {
                plato: 'Chicharrón de Calamar',
                ingredientes: [
                    { insumo: 'pota fresca', cant: 0.250, critico: 1 },
                    { insumo: 'harina de trigo', cant: 0.080, critico: 0 },
                    { insumo: 'chuño', cant: 0.040, critico: 0 },
                    { insumo: 'aceite vegetal', cant: 0.150, critico: 0 },
                    { insumo: 'yuca amarilla', cant: 0.150, critico: 0 }
                ]
            },
            {
                plato: 'Jalea',
                ingredientes: [
                    { insumo: 'pescado bonito', cant: 0.180, critico: 1 },
                    { insumo: 'mixtura de mariscos', cant: 0.180, critico: 1 },
                    { insumo: 'pota fresca', cant: 0.120, critico: 0 },
                    { insumo: 'harina de trigo', cant: 0.120, critico: 0 },
                    { insumo: 'aceite vegetal', cant: 0.200, critico: 0 },
                    { insumo: 'yuca amarilla', cant: 0.200, critico: 0 },
                    { insumo: 'cebolla roja', cant: 0.080, critico: 0 }
                ]
            },
            // ARROCES
            {
                plato: 'Arroz con Mariscos',
                ingredientes: [
                    { insumo: 'mixtura de mariscos', cant: 0.220, critico: 1 },
                    { insumo: 'arroz extra', cant: 0.200, critico: 1 },
                    { insumo: 'pasta de ají amarillo', cant: 0.050, critico: 0 },
                    { insumo: 'pasta de ají panca', cant: 0.030, critico: 0 },
                    { insumo: 'chicha de jora', cant: 0.050, critico: 0 },
                    { insumo: 'fondo concentrado', cant: 0.150, critico: 0 }
                ]
            },
            {
                plato: 'Chaufa de Mariscos',
                ingredientes: [
                    { insumo: 'mixtura de mariscos', cant: 0.200, critico: 1 },
                    { insumo: 'arroz extra', cant: 0.220, critico: 1 },
                    { insumo: 'huevo fresco', cant: 1.000, critico: 0 },
                    { insumo: 'sillao', cant: 0.040, critico: 0 },
                    { insumo: 'aceite de ajonjolí', cant: 0.010, critico: 0 },
                    { insumo: 'kión', cant: 0.010, critico: 0 }
                ]
            },
            {
                plato: 'Chaufa de Pescado',
                ingredientes: [
                    { insumo: 'pescado bonito', cant: 0.200, critico: 1 },
                    { insumo: 'arroz extra', cant: 0.220, critico: 1 },
                    { insumo: 'huevo fresco', cant: 1.000, critico: 0 },
                    { insumo: 'sillao', cant: 0.040, critico: 0 },
                    { insumo: 'aceite de ajonjolí', cant: 0.010, critico: 0 }
                ]
            },
            // SOPAS & CALDOS
            {
                plato: 'Chilcano',
                ingredientes: [
                    { insumo: 'fondo concentrado', cant: 0.400, critico: 1 },
                    { insumo: 'pescado bonito', cant: 0.100, critico: 1 },
                    { insumo: 'limón sutil', cant: 0.060, critico: 0 },
                    { insumo: 'canchita', cant: 0.030, critico: 0 },
                    { insumo: 'cebolla roja', cant: 0.040, critico: 0 }
                ]
            },
            {
                plato: 'Parihuela',
                ingredientes: [
                    { insumo: 'pescado corvina', cant: 0.180, critico: 1 },
                    { insumo: 'mixtura de mariscos', cant: 0.200, critico: 1 },
                    { insumo: 'cangrejo marino', cant: 1.000, critico: 1 },
                    { insumo: 'pasta de ají panca', cant: 0.060, critico: 0 },
                    { insumo: 'chicha de jora', cant: 0.080, critico: 0 },
                    { insumo: 'fondo concentrado', cant: 0.350, critico: 0 }
                ]
            },
            {
                plato: 'Sudado',
                ingredientes: [
                    { insumo: 'pescado corvina', cant: 0.250, critico: 1 },
                    { insumo: 'tomate italiano', cant: 0.100, critico: 0 },
                    { insumo: 'cebolla roja', cant: 0.120, critico: 0 },
                    { insumo: 'chicha de jora', cant: 0.080, critico: 0 },
                    { insumo: 'yuca amarilla', cant: 0.150, critico: 0 }
                ]
            },
            // GUISOS
            {
                plato: 'Pescado a lo Macho',
                ingredientes: [
                    { insumo: 'pescado corvina', cant: 0.220, critico: 1 },
                    { insumo: 'mixtura de mariscos', cant: 0.180, critico: 1 },
                    { insumo: 'pasta de ají amarillo', cant: 0.060, critico: 0 },
                    { insumo: 'arroz extra', cant: 0.180, critico: 0 },
                    { insumo: 'fondo concentrado', cant: 0.120, critico: 0 }
                ]
            }
        ];

        let recetasInsertadas = 0;
        for (const prod of todosProductos) {
            const recetaMatch = recetasMaestras.find(r => prod.nombre.toLowerCase().includes(r.plato.toLowerCase()));
            if (recetaMatch) {
                // Borrar recetas previas para que quede limpia y exacta
                await conn.query(`DELETE FROM recetas_detalles WHERE producto_id = ?`, [prod.id]);
                for (const ing of recetaMatch.ingredientes) {
                    const insId = getInsId(ing.insumo);
                    if (insId) {
                        await conn.query(`
                            INSERT INTO recetas_detalles (producto_id, insumo_id, cantidad_requerida, es_critico)
                            VALUES (?, ?, ?, ?)
                        `, [prod.id, insId, ing.cant, ing.critico]);
                        recetasInsertadas++;
                    }
                }
            }
        }
        console.log(`✅ Escandallos y Fichas Técnicas generadas: ${recetasInsertadas} vínculos insumo-plato creados.`);

        console.log('🎉 Migración de Súper BD completada con éxito.');
    } catch (err) {
        console.error('❌ Error en migración de Súper BD:', err);
    } finally {
        await conn.end();
    }
}

migrarSuperBD();
