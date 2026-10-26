/**
 * SEED EXPANSION - CLIENTES Y RECETAS TÉCNICAS
 * Agrega:
 * - Tabla clientes (DNI / RUC, nombres, telefono, direccion, historial)
 * - Muestra representativa de 30 clientes reales peruanos frecuentes
 * - Insumos marítimos completos y recetas técnicas para los platos del menú
 */

const mysql = require('mysql2/promise');

async function seedExpansion() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '1234',
        database: process.env.DB_NAME || 'sistema_restaurante'
    });

    console.log('🔗 Conectado a MySQL para expansión de clientes e inventario...');

    try {
        // 1. Crear tabla clientes si no existe
        console.log('1️⃣ Creando tabla clientes...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS clientes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tipo_documento ENUM('DNI', 'RUC') NOT NULL DEFAULT 'DNI',
                numero_documento VARCHAR(15) NOT NULL UNIQUE,
                nombre_completo VARCHAR(200) NOT NULL,
                telefono VARCHAR(25) NULL,
                direccion VARCHAR(255) NULL,
                email VARCHAR(100) NULL,
                total_visitas INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_doc (numero_documento)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 2. Insertar cartera de clientes representativa
        console.log('2️⃣ Insertando clientes peruanos frecuentes...');
        await connection.query(`
            INSERT IGNORE INTO clientes (tipo_documento, numero_documento, nombre_completo, telefono, direccion) VALUES
            ('DNI', '72839401', 'Juan Carlos Mendoza Silva', '987654321', 'Av. Larco 450, Miraflores'),
            ('DNI', '45892014', 'María Elena Quispe Rojas', '998877665', 'Calle Los Pinos 123, San Isidro'),
            ('DNI', '10293847', 'Carlos Alberto Vargas Ríos', '971234567', 'Jr. Huancavelica 542, Lima'),
            ('DNI', '78901234', 'Andrea Sofía Benavides Castro', '965432198', 'Av. El Sol 890, Barranco'),
            ('DNI', '41239876', 'Pedro Pablo Huamán Gutiérrez', '954321678', 'Av. Grau 310, Chorrillos'),
            ('DNI', '09876543', 'Rosa Mercedes Chávez Torres', '943210987', 'Calle Las Begonias 789, Lince'),
            ('DNI', '73456789', 'Diego Armando Flores Sánchez', '932109876', 'Av. Arequipa 2450, Lince'),
            ('DNI', '46789012', 'Valeria Inés Morales Cárdenas', '921098765', 'Calle San Martín 340, Magdalena'),
            ('DNI', '15678901', 'Jorge Luis Tello Paredes', '910987654', 'Av. Brasil 1890, Jesús María'),
            ('DNI', '70123456', 'Fiorella Patricia Rivas Medina', '909876543', 'Av. Salaverry 1200, Jesús María'),
            ('DNI', '48901234', 'Manuel Enrique Farfán Alva', '989012345', 'Calle Schell 220, Miraflores'),
            ('DNI', '75678901', 'Camila Alejandra Vidal Romero', '978901234', 'Av. Benavides 1530, Surco'),
            ('DNI', '43210987', 'Ricardo Javier Castillo Ortiz', '967890123', 'Calle Bolognesi 410, Miraflores'),
            ('DNI', '76789012', 'Luciana Belén Salazar Guerrero', '956789012', 'Av. La Encalada 890, Surco'),
            ('DNI', '49012345', 'Gonzalo Mauricio Espinoza Paz', '945678901', 'Calle Berlín 650, Miraflores'),
            ('DNI', '71234567', 'Claudia Milagros Ramos Cruz', '934567890', 'Av. Dos de Mayo 940, San Isidro'),
            ('DNI', '44567890', 'Víctor Hugo Palacios León', '923456789', 'Av. Sucre 410, Pueblo Libre'),
            ('DNI', '77890123', 'Stephanie Denisse Carrillo Soto', '912345678', 'Calle Tarata 180, Miraflores'),
            ('DNI', '42345678', 'Álvaro Sebastián Navarro Ruiz', '901234567', 'Av. Del Ejército 720, Miraflores'),
            ('DNI', '79012345', 'Gabriela Rocío Campos Vega', '987123456', 'Calle Alcanfores 310, Miraflores'),
            ('RUC', '20601234567', 'INVERSIONES GASTRONÓMICAS DEL SUR S.A.C.', '01-4456789', 'Av. Javier Prado Este 4200, Surco'),
            ('RUC', '20519876543', 'CORPORACIÓN MARINA DEL PACÍFICO E.I.R.L.', '01-2219876', 'Av. Rivera Navarrete 765, San Isidro'),
            ('RUC', '20100234567', 'SERVICIOS COMERCIALES LIMA NORTE S.A.', '01-5341234', 'Av. Carlos Izaguirre 1250, Los Olivos'),
            ('RUC', '20498765432', 'DISTRIBUIDORA Y LOGÍSTICA PERUANA S.A.C.', '01-3498765', 'Av. Elmer Faucett 1980, Callao'),
            ('RUC', '20608765432', 'CONSULTORA EMPRESARIAL ANDINA S.A.C.', '01-6109876', 'Calle Dean Valdivia 148, San Isidro');
        `);

        // 3. Insertar más insumos marinos y de cocina criolla
        console.log('3️⃣ Ampliando catálogo de materias primas e insumos...');
        await connection.query(`
            INSERT IGNORE INTO insumos (codigo, nombre, descripcion, unidad_medida, stock_actual, stock_minimo, costo_unitario) VALUES
            ('INS-MAR-007', 'Mixtura de Mariscos (Pulpo, Calamar, Langostino)', 'Mariscos precocidos limpios', 'KG', 25.0000, 5.0000, 38.0000),
            ('INS-POT-008', 'Pota Fresca Laminada', 'Pota fresca para chicharrón y ceviche carretillero', 'KG', 20.0000, 4.0000, 14.0000),
            ('INS-ARR-009', 'Arroz Extra Añejo', 'Arroz de grano largo para arroces y chaufa', 'KG', 50.0000, 10.0000, 4.2000),
            ('INS-AJI-010', 'Pasta de Ají Amarillo', 'Pasta concentrada de ají amarillo', 'KG', 12.0000, 3.0000, 8.5000),
            ('INS-ROC-011', 'Pasta de Rocoto', 'Pasta de rocoto sin venas para tiraditos', 'KG', 8.0000, 2.0000, 9.0000),
            ('INS-CIL-012', 'Culantro Fresco Picado', 'Culantro fresco aromático', 'KG', 4.0000, 1.0000, 6.0000),
            ('INS-CON-013', 'Conchas Negras Frescas', 'Conchas negras de Tumbes vivas', 'UND', 120.0000, 24.0000, 1.8000),
            ('INS-YUC-014', 'Yuca Frita / Sancochada', 'Porciones de yuca amarilla suave', 'KG', 25.0000, 5.0000, 3.8000),
            ('INS-CAR-015', 'Lomo Fino de Res', 'Cortes de lomo fino para saltado', 'KG', 15.0000, 3.0000, 42.0000),
            ('INS-TOM-016', 'Tomate Chanchamayo', 'Tomate gajos gruesos para lomo saltado', 'KG', 10.0000, 2.0000, 3.2000),
            ('INS-PAP-017', 'Papas Amarillas / Fritas', 'Papa bastón crocante', 'KG', 30.0000, 8.0000, 3.5000),
            ('INS-SIY-018', 'Sillao Oscuro / Salsa Ostión', 'Salsa de soya oriental', 'LT', 10.0000, 2.0000, 7.5000);
        `);

        // 4. Vincular recetas para los platos principales del restaurante
        console.log('4️⃣ Vinculando recetas técnicas (escandallos) a platos principales...');
        
        // Helper para asociar receta por nombre de plato e insumo
        const vincularReceta = async (nombrePlato, codigoInsumo, cantidad, esCritico = true) => {
            const [p] = await connection.query('SELECT id FROM productos WHERE nombre LIKE ? LIMIT 1', [`%${nombrePlato}%`]);
            const [i] = await connection.query('SELECT id FROM insumos WHERE codigo = ? LIMIT 1', [codigoInsumo]);
            if (p.length > 0 && i.length > 0) {
                await connection.query(`
                    INSERT IGNORE INTO recetas_detalles (producto_id, insumo_id, cantidad_requerida, es_critico)
                    VALUES (?, ?, ?, ?)
                `, [p[0].id, i[0].id, cantidad, esCritico]);
            }
        };

        // Lomo Saltado
        await vincularReceta('Lomo Saltado', 'INS-CAR-015', 0.2200, true); // 220g carne
        await vincularReceta('Lomo Saltado', 'INS-CEB-003', 0.0900, true); // 90g cebolla
        await vincularReceta('Lomo Saltado', 'INS-TOM-016', 0.0800, true); // 80g tomate
        await vincularReceta('Lomo Saltado', 'INS-PAP-017', 0.1800, false); // 180g papa
        await vincularReceta('Lomo Saltado', 'INS-ARR-009', 0.1500, false); // 150g arroz

        // Cebiche Clásico
        await vincularReceta('Cebiche de Pescado Clásico', 'INS-PES-001', 0.2400, true);
        await vincularReceta('Cebiche de Pescado Clásico', 'INS-LIM-002', 0.1400, true);
        await vincularReceta('Cebiche de Pescado Clásico', 'INS-CEB-003', 0.0800, true);
        await vincularReceta('Cebiche de Pescado Clásico', 'INS-CAM-005', 1.0000, false);

        // Cebiche Carretillero
        await vincularReceta('Cebiche Carretillero', 'INS-PES-001', 0.1800, true);
        await vincularReceta('Cebiche Carretillero', 'INS-POT-008', 0.1500, true);
        await vincularReceta('Cebiche Carretillero', 'INS-LIM-002', 0.1400, true);
        await vincularReceta('Cebiche Carretillero', 'INS-CEB-003', 0.0800, true);

        // Tiradito al Ají Amarillo
        await vincularReceta('Tiradito al Ají Amarillo', 'INS-PES-001', 0.2000, true);
        await vincularReceta('Tiradito al Ají Amarillo', 'INS-AJI-010', 0.0800, true);
        await vincularReceta('Tiradito al Ají Amarillo', 'INS-LIM-002', 0.1200, true);
        await vincularReceta('Tiradito al Ají Amarillo', 'INS-CHO-006', 0.0600, false);

        // Leche de Tigre
        await vincularReceta('Leche de Tigre', 'INS-PES-001', 0.1200, true);
        await vincularReceta('Leche de Tigre', 'INS-LIM-002', 0.1000, true);
        await vincularReceta('Leche de Tigre', 'INS-CEB-003', 0.0500, true);
        await vincularReceta('Leche de Tigre', 'INS-CHO-006', 0.0500, false);

        // Conchas Negras
        await vincularReceta('Conchas Negras', 'INS-CON-013', 12.0000, true);
        await vincularReceta('Conchas Negras', 'INS-LIM-002', 0.1500, true);
        await vincularReceta('Conchas Negras', 'INS-CEB-003', 0.0800, true);

        console.log('✅ Expansión de base de datos terminada con éxito.');
    } catch (err) {
        console.error('❌ Error en seedExpansion:', err);
    } finally {
        await connection.end();
    }
}

seedExpansion();
