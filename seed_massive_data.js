/**
 * SEED MASSIVE DATA - DON BIGOTE
 * Expande la base de datos con:
 * - 55 nuevos clientes peruanos frecuentes (DNI y RUC)
 * - 30 nuevos platos de alta cocina marina y bar
 * - Nuevos insumos marítimos y recetas técnicas
 */

const mysql = require('mysql2/promise');

async function seedMassive() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '1234',
        database: process.env.DB_NAME || 'sistema_restaurante'
    });

    console.log('🔗 Conectado para expansión masiva de clientes, platos e insumos...');

    try {
        // 1. Clientes masivos
        console.log('1️⃣ Insertando 55 nuevos clientes peruanos...');
        await conn.query(`
            INSERT IGNORE INTO clientes (tipo_documento, numero_documento, nombre_completo, telefono, direccion, total_visitas) VALUES
            ('DNI', '47182934', 'Patricia Lucía Herrera Villacorta', '991234567', 'Av. 28 de Julio 880, Miraflores', 4),
            ('DNI', '70293841', 'Renato Alonso Salazar Montoya', '982345678', 'Calle Las Palmeras 340, San Isidro', 7),
            ('DNI', '42819304', 'Karina Paola Delgado Mendoza', '973456789', 'Av. La Marina 1840, San Miguel', 3),
            ('DNI', '74928103', 'Sebastián Ignacio Paredes Castro', '964567890', 'Jr. Junín 450, Magdalena del Mar', 5),
            ('DNI', '41920384', 'Milagros del Carmen Rivas Quispe', '955678901', 'Av. Javier Prado Oeste 1210, Magdalena', 8),
            ('DNI', '76019283', 'Franco David Barrenechea Torres', '946789012', 'Calle Los Sauces 215, Surco', 2),
            ('DNI', '43829104', 'Fiorella Beatríz Cárdenas Ponce', '937890123', 'Av. Guardia Civil 520, San Borja', 9),
            ('DNI', '71829304', 'Gustavo Adolfo Palomino Silva', '928901234', 'Calle Berlín 820, Miraflores', 6),
            ('DNI', '44910293', 'Lorena Isabel Alva Huamán', '919012345', 'Av. Benavides 2400, Miraflores', 4),
            ('DNI', '77019284', 'Rodrigo Andrés Céspedes Campos', '980123456', 'Calle Bolognesi 650, Miraflores', 11),
            ('DNI', '45819203', 'Adriana Cecilia Romero Vega', '971234890', 'Av. Brasil 2900, Magdalena', 3),
            ('DNI', '72910384', 'Christian Enrique Gálvez Peña', '962345901', 'Calle Schell 480, Miraflores', 5),
            ('DNI', '46920193', 'Mariana Stefany Valdivia Cruz', '953456012', 'Av. Angamos Oeste 740, Miraflores', 7),
            ('DNI', '78192034', 'Guillermo Tomás Benítez Ortiz', '944567123', 'Calle Alcanfores 590, Miraflores', 2),
            ('DNI', '47910283', 'Daniela Alejandra Cáceres Soto', '935678234', 'Av. Costanera 1120, San Miguel', 6),
            ('DNI', '73829104', 'Mateo Emiliano Villegas Ruiz', '926789345', 'Jr. Bellavista 320, Miraflores', 8),
            ('DNI', '48819203', 'Lucía Fernanda Quiroz León', '917890456', 'Av. Universitaria 1450, San Miguel', 4),
            ('DNI', '79018293', 'Joaquín Marcelo Carranza Dávila', '988901567', 'Calle Tarata 260, Miraflores', 10),
            ('DNI', '49829102', 'Brenda Vanessa Noriega Ramos', '979012678', 'Av. Salaverry 2100, Jesús María', 3),
            ('DNI', '74819203', 'Eduardo Daniel Figueroa Tello', '960123789', 'Calle San Martín 580, Miraflores', 5),
            ('DNI', '41029384', 'Carla Giuliana Medina Farfán', '951234890', 'Av. Arequipa 3800, Miraflores', 6),
            ('DNI', '75920193', 'Álvaro Martín Zegarra Pacheco', '942345901', 'Calle Diez Canseco 410, Miraflores', 4),
            ('DNI', '42019283', 'Rocío del Pilar Villalobos Rey', '933456012', 'Av. Sucre 890, Pueblo Libre', 9),
            ('DNI', '76829104', 'Nicolás Alejandro Cuenca Bravo', '924567123', 'Jr. Bolognesi 190, Magdalena', 2),
            ('DNI', '43102938', 'Jessica Paola Samaniego Díaz', '915678234', 'Av. Chorrillos 450, Chorrillos', 7),
            ('DNI', '77910283', 'Alejandro Gabriel Prado Montero', '986789345', 'Calle Enrique Palacios 620, Miraflores', 12),
            ('DNI', '44291029', 'Stephanie Beatriz Luján Morales', '977890456', 'Av. José Pardo 920, Miraflores', 5),
            ('DNI', '78829104', 'Héctor Manuel Córdova Ríos', '968901567', 'Jr. Domeyer 210, Barranco', 8),
            ('DNI', '45391029', 'Evelyn Roxana Guevara Tapia', '959012678', 'Av. Pedro de Osma 410, Barranco', 3),
            ('DNI', '79910283', 'Leonardo Favio Santillán Solís', '940123789', 'Calle Manuel Bonilla 180, Miraflores', 6),
            ('DNI', '46492019', 'Vanessa Carolina Quintana Vega', '931234890', 'Av. Del Ejército 1350, Miraflores', 4),
            ('DNI', '71029384', 'Bruno César Villacorta Luna', '922345901', 'Calle Recavarren 290, Miraflores', 7),
            ('DNI', '47581920', 'Tatiana María Obregón Silva', '913456012', 'Av. Santa Cruz 980, Miraflores', 5),
            ('DNI', '72102938', 'Mauricio Andrés Pinedo Guzmán', '984567123', 'Calle Los Libertadores 440, San Isidro', 9),
            ('DNI', '48692019', 'Wendy Elizabeth Hurtado Rosas', '975678234', 'Av. Paz Soldán 190, San Isidro', 3),
            ('DNI', '73201928', 'Esteban Rafael Montoya Arana', '966789345', 'Calle Conquistadores 780, San Isidro', 11),
            ('DNI', '49781920', 'Silvia Teresa Balbuena Cano', '957890456', 'Av. Cavenecia 260, San Isidro', 6),
            ('DNI', '74301928', 'Felipe Ignacio Carpio Bendezú', '948901567', 'Calle Miguel Dasso 150, San Isidro', 4),
            ('DNI', '41892019', 'Cynthia Marisol Barreto Loayza', '939012678', 'Av. Coronel Portillo 620, San Isidro', 8),
            ('DNI', '75401928', 'Gabriel Omar Valenzuela Rengifo', '920123789', 'Calle Alberto Lynch 210, San Isidro', 5),
            ('DNI', '42981920', 'Gisella Katherine Ponce Viteri', '911234890', 'Av. Camino Real 1120, San Isidro', 7),
            ('DNI', '76501928', 'Julio César Manrique Calderón', '982345901', 'Calle Los Sauces 410, San Borja', 3),
            ('DNI', '43092019', 'Ingrid Johana Espinal Chávez', '973456012', 'Av. Las Artes Sur 890, San Borja', 6),
            ('DNI', '77601928', 'Óscar Rodolfo Salcedo Ugarte', '964567123', 'Calle Claude Monteverdi 180, San Borja', 10),
            ('DNI', '44192019', 'Katia Milena Castañeda Bernaola', '955678234', 'Av. Aviación 3250, San Borja', 4),
            ('RUC', '20603456789', 'PESQUERA DEL CALLAO S.A.C.', '01-4298765', 'Av. Manco Cápac 450, Callao', 14),
            ('RUC', '20556789012', 'GRUPO GASTRONÓMICO MIRAFLORES S.R.L.', '01-4467890', 'Calle Las Pizzas 120, Miraflores', 8),
            ('RUC', '20451234567', 'COMERCIALIZADORA MARÍTIMA DEL PERÚ E.I.R.L.', '01-4521234', 'Av. Sáenz Peña 780, Callao', 12),
            ('RUC', '20609876543', 'INVERSIONES SAN BORJA GOURMET S.A.C.', '01-2256789', 'Av. San Luis 1980, San Borja', 6),
            ('RUC', '20501239874', 'DISTRIBUIDORA DE ALIMENTOS DEL PACÍFICO S.A.', '01-3367890', 'Av. Elmer Faucett 2400, Bellavista', 9),
            ('RUC', '20604567891', 'SERVICIOS HOTELEROS Y TURÍSTICOS LIMA S.A.C.', '01-6159870', 'Av. José Larco 1100, Miraflores', 5),
            ('RUC', '20523456781', 'TRANSPORTES Y LOGÍSTICA COSTERA E.I.R.L.', '01-5748901', 'Av. Néstor Gambetta 3400, Callao', 7),
            ('RUC', '20607891234', 'CORPORACIÓN CULINARIA ANDINA S.A.C.', '01-4412345', 'Calle Chinchón 890, San Isidro', 11),
            ('RUC', '20489012345', 'INMOBILIARIA Y CONSTRUCTORA DEL SUR S.A.', '01-2719080', 'Av. El Derby 250, Santiago de Surco', 4),
            ('RUC', '20606789012', 'EVENTOS Y CATERING DON JULIO S.R.L.', '01-3445566', 'Calle General Borgoño 350, Miraflores', 8);
        `);

        // 2. Nuevos Insumos
        console.log('2️⃣ Registrando insumos complementarios...');
        await conn.query(`
            INSERT IGNORE INTO insumos (codigo, nombre, descripcion, unidad_medida, stock_actual, stock_minimo, costo_unitario) VALUES
            ('INS-022', 'Pisco Quebranta (Puro)', 'Pisco peruano 100% puro para cócteles y flameados', 'LT', 25.000, 5.000, 32.00),
            ('INS-023', 'Conchas de Abanico Seleccionadas', 'Conchas frescas con coral para parmesana y tiraditos', 'UND', 120.000, 30.000, 1.80),
            ('INS-024', 'Queso Parmesano Rallado', 'Queso madurado de alta calidad para gratinados', 'KG', 8.000, 2.000, 45.00),
            ('INS-025', 'Palta Fuerte de Exportación', 'Palta cremosa para causas, tiraditos y ensaladas', 'KG', 18.000, 4.000, 9.50),
            ('INS-026', 'Salsa de Soya (Sillao Especial)', 'Sillao oscuro premium para chaufa y tiraditos nikkei', 'LT', 15.000, 3.000, 14.00),
            ('INS-027', 'Aceite de Ajonjolí Tostado', 'Aceite aromático oriental para cocina marina nikkei', 'LT', 6.000, 1.500, 28.00),
            ('INS-028', 'Jarabe de Goma Artesanal', 'Almíbar de caña de azúcar para cócteles y sours', 'LT', 20.000, 5.000, 10.00),
            ('INS-029', 'Maracuyá Pulpa Pura', 'Extracto natural de maracuyá 100% concentrado', 'LT', 30.000, 8.000, 12.00);
        `);

        // 3. Nuevos Platos
        console.log('3️⃣ Insertando 25 nuevos platos de alta cocina marina y bar...');
        await conn.query(`
            INSERT IGNORE INTO productos (nombre, precio, categoria_id, tipo_producto, disponible) VALUES
            -- Cebiches & Tiraditos
            ('Cebiche Don Bigote Especial (Pesca del Día + Pulpo + Conchas)', 46.00, 7, 'PREPARADO', TRUE),
            ('Tiradito Nikkei al Shoyu y Aceite de Ajonjolí', 38.00, 8, 'PREPARADO', TRUE),
            ('Tiradito al Rocoto Ahumado', 34.00, 8, 'PREPARADO', TRUE),
            ('Leche de Tigre Apaltada al Ají Amarillo', 22.00, 9, 'PREPARADO', TRUE),

            -- Entradas Frías & Calientes
            ('Causa Acebichada Don Bigote', 28.00, 10, 'PREPARADO', TRUE),
            ('Conchas a la Parmesana (Media Docena)', 32.00, 10, 'PREPARADO', TRUE),
            ('Tequeños Rellenos de Mariscos (8 unidades)', 24.00, 10, 'PREPARADO', TRUE),
            ('Chicharrón de Langostinos al Panko', 38.00, 10, 'PREPARADO', TRUE),

            -- Mariscos & Platos Fuertes
            ('Jalea Real Don Bigote (Para 3-4 personas)', 75.00, 11, 'PREPARADO', TRUE),
            ('Rissotto Marino al Ají Amarillo con Pulpo Grillado', 45.00, 11, 'PREPARADO', TRUE),
            ('Filete de Pescado en Salsa de Mariscos', 36.00, 11, 'PREPARADO', TRUE),
            ('Corvina Entera Frita con Patacones', 42.00, 1, 'PREPARADO', TRUE),

            -- Arroces & Wok
            ('Arroz con Mariscos a la Chalaca Especial', 38.00, 12, 'PREPARADO', TRUE),
            ('Arroz Chaufa Marino Don Bigote', 34.00, 12, 'PREPARADO', TRUE),
            ('Tacu Tacu Criollo con Lomo al Jugo', 36.00, 15, 'PREPARADO', TRUE),

            -- Sopas & Sudados
            ('Parihuela Don Bigote con Cangrejo Entero', 45.00, 13, 'PREPARADO', TRUE),
            ('Chilcano Especial con Dados de Pescado', 18.00, 13, 'PREPARADO', TRUE),
            ('Sudado de Cabrilla al Vino Blanco', 39.00, 14, 'PREPARADO', TRUE),

            -- Bar & Coctelería
            ('Pisco Sour Clásico Don Bigote', 18.00, 2, 'PREPARADO', TRUE),
            ('Maracuyá Sour', 19.00, 2, 'PREPARADO', TRUE),
            ('Chilcano de Pisco Clásico', 16.00, 2, 'PREPARADO', TRUE),
            ('Limonada de Hierbabuena Frozen (Jarra 1L)', 16.00, 3, 'PREPARADO', TRUE),

            -- Postres
            ('Suspiro a la Limeña Clásico', 12.00, 6, 'PREPARADO', TRUE),
            ('Pie de Limón Don Bigote', 11.00, 6, 'PREPARADO', TRUE),
            ('Combinado Limeño (Arroz con Leche + Mazamorra)', 9.00, 6, 'PREPARADO', TRUE);
        `);

        // 4. Conectar Recetas Técnicas para los nuevos platos preparados
        console.log('4️⃣ Vinculando recetas técnicas a los nuevos platos...');
        
        // Obtener IDs de platos e insumos recién creados
        const [pRows] = await conn.query(`SELECT id, nombre FROM productos`);
        const pMap = {};
        pRows.forEach(r => { pMap[r.nombre] = r.id; });

        const [iRows] = await conn.query(`SELECT id, codigo FROM insumos`);
        const iMap = {};
        iRows.forEach(r => { iMap[r.codigo] = r.id; });

        // Insumos disponibles:
        // INS-001 (Pescado), INS-002 (Limón), INS-003 (Cebolla), INS-004 (Camote), INS-005 (Choclo)
        // INS-006 (Arroz), INS-007 (Mariscos Mixtos), INS-008 (Calamar), INS-009 (Langostino), INS-010 (Pulpo)
        // INS-011 (Pota), INS-012 (Conchas Negras), INS-013 (Ají Amarillo), INS-014 (Culantro)
        // INS-022 (Pisco), INS-023 (Conchas Abanico), INS-024 (Queso Parmesano), INS-025 (Palta), INS-028 (Jarabe Goma), INS-029 (Maracuyá)

        const recetasNuevas = [
            // Cebiche Don Bigote Especial
            { plato: 'Cebiche Don Bigote Especial (Pesca del Día + Pulpo + Conchas)', insumo: 'INS-001', cant: 0.180, crit: 1 },
            { plato: 'Cebiche Don Bigote Especial (Pesca del Día + Pulpo + Conchas)', insumo: 'INS-010', cant: 0.080, crit: 1 },
            { plato: 'Cebiche Don Bigote Especial (Pesca del Día + Pulpo + Conchas)', insumo: 'INS-023', cant: 3.000, crit: 1 },
            { plato: 'Cebiche Don Bigote Especial (Pesca del Día + Pulpo + Conchas)', insumo: 'INS-002', cant: 0.150, crit: 0 },
            { plato: 'Cebiche Don Bigote Especial (Pesca del Día + Pulpo + Conchas)', insumo: 'INS-003', cant: 0.100, crit: 0 },

            // Conchas a la Parmesana
            { plato: 'Conchas a la Parmesana (Media Docena)', insumo: 'INS-023', cant: 6.000, crit: 1 },
            { plato: 'Conchas a la Parmesana (Media Docena)', insumo: 'INS-024', cant: 0.100, crit: 1 },

            // Causa Acebichada
            { plato: 'Causa Acebichada Don Bigote', insumo: 'INS-001', cant: 0.120, crit: 1 },
            { plato: 'Causa Acebichada Don Bigote', insumo: 'INS-025', cant: 0.100, crit: 0 },
            { plato: 'Causa Acebichada Don Bigote', insumo: 'INS-002', cant: 0.080, crit: 0 },

            // Jalea Real Don Bigote
            { plato: 'Jalea Real Don Bigote (Para 3-4 personas)', insumo: 'INS-001', cant: 0.400, crit: 1 },
            { plato: 'Jalea Real Don Bigote (Para 3-4 personas)', insumo: 'INS-008', cant: 0.250, crit: 1 },
            { plato: 'Jalea Real Don Bigote (Para 3-4 personas)', insumo: 'INS-010', cant: 0.150, crit: 1 },

            // Parihuela Don Bigote
            { plato: 'Parihuela Don Bigote con Cangrejo Entero', insumo: 'INS-001', cant: 0.250, crit: 1 },
            { plato: 'Parihuela Don Bigote con Cangrejo Entero', insumo: 'INS-007', cant: 0.200, crit: 1 },

            // Pisco Sour
            { plato: 'Pisco Sour Clásico Don Bigote', insumo: 'INS-022', cant: 0.090, crit: 1 },
            { plato: 'Pisco Sour Clásico Don Bigote', insumo: 'INS-002', cant: 0.050, crit: 0 },
            { plato: 'Pisco Sour Clásico Don Bigote', insumo: 'INS-028', cant: 0.030, crit: 0 },

            // Maracuyá Sour
            { plato: 'Maracuyá Sour', insumo: 'INS-022', cant: 0.090, crit: 1 },
            { plato: 'Maracuyá Sour', insumo: 'INS-029', cant: 0.050, crit: 1 }
        ];

        for (const r of recetasNuevas) {
            const pId = pMap[r.plato];
            const iId = iMap[r.insumo];
            if (pId && iId) {
                await conn.query(`
                    INSERT IGNORE INTO recetas_detalles (producto_id, insumo_id, cantidad_requerida, es_critico)
                    VALUES (?, ?, ?, ?)
                `, [pId, iId, r.cant, r.crit]);
            }
        }

        console.log('✅ Expansión masiva completada exitosamente.');

    } catch (err) {
        console.error('❌ Error en expansión:', err);
    } finally {
        await conn.end();
    }
}

seedMassive();
