-- ========================================================
-- COPIA DE SEGURIDAD AUTOMÁTICA — LA SAZÓN DE DON BIGOTE
-- Base de Datos: sistema_restaurante
-- Fecha de Creación: 2026-10-13T00:27:10.135Z
-- Total de Tablas: 19
-- ========================================================

SET FOREIGN_KEY_CHECKS=0;

-- --------------------------------------------------------
-- Estructura de tabla: `auditoria_eventos`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `auditoria_eventos`;
CREATE TABLE `auditoria_eventos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `usuario_id` int DEFAULT NULL,
  `accion` varchar(100) NOT NULL,
  `tabla_afectada` varchar(50) NOT NULL,
  `registro_id` int DEFAULT NULL,
  `datos_anteriores` json DEFAULT NULL,
  `datos_nuevos` json DEFAULT NULL,
  `ip_origen` varchar(45) DEFAULT NULL,
  `fecha_hora` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `auditoria_eventos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Estructura de tabla: `cambios_platos`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `cambios_platos`;
CREATE TABLE `cambios_platos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pedido_id` int NOT NULL,
  `mesa_nombre` varchar(50) NOT NULL,
  `usuario_id` int NOT NULL,
  `usuario_nombre` varchar(100) NOT NULL,
  `producto_anterior_id` int NOT NULL,
  `producto_anterior_nombre` varchar(150) NOT NULL,
  `producto_nuevo_id` int NOT NULL,
  `producto_nuevo_nombre` varchar(150) NOT NULL,
  `precio_anterior` decimal(10,2) NOT NULL,
  `precio_nuevo` decimal(10,2) NOT NULL,
  `diferencia` decimal(10,2) NOT NULL,
  `motivo` varchar(255) NOT NULL,
  `fue_merma_cocina` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pedido` (`pedido_id`),
  KEY `idx_fecha` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Estructura de tabla: `categorias`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `categorias`;
CREATE TABLE `categorias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Datos volcados para `categorias` (16 registros)
INSERT INTO `categorias` (`id`, `nombre`) VALUES (1, 'Platos Fuertes');
INSERT INTO `categorias` (`id`, `nombre`) VALUES (2, 'Bebidas');
INSERT INTO `categorias` (`id`, `nombre`) VALUES (3, 'Bebidas Frías');
INSERT INTO `categorias` (`id`, `nombre`) VALUES (4, 'Cervezas');
INSERT INTO `categorias` (`id`, `nombre`) VALUES (5, 'Helados');
INSERT INTO `categorias` (`id`, `nombre`) VALUES (6, 'Postres');
INSERT INTO `categorias` (`id`, `nombre`) VALUES (7, 'Cebiches');
INSERT INTO `categorias` (`id`, `nombre`) VALUES (8, 'Tiraditos');
INSERT INTO `categorias` (`id`, `nombre`) VALUES (9, 'Leche de Tigre');
INSERT INTO `categorias` (`id`, `nombre`) VALUES (10, 'Entradas');
INSERT INTO `categorias` (`id`, `nombre`) VALUES (11, 'Mariscos');
INSERT INTO `categorias` (`id`, `nombre`) VALUES (12, 'Arroces');
INSERT INTO `categorias` (`id`, `nombre`) VALUES (13, 'Sopas');
INSERT INTO `categorias` (`id`, `nombre`) VALUES (14, 'Sudados');
INSERT INTO `categorias` (`id`, `nombre`) VALUES (15, 'Comidas Criollas');
INSERT INTO `categorias` (`id`, `nombre`) VALUES (16, 'Guarniciones');

-- --------------------------------------------------------
-- Estructura de tabla: `cierres_caja`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `cierres_caja`;
CREATE TABLE `cierres_caja` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cajero_nombre` varchar(100) DEFAULT NULL,
  `tipo_cierre` enum('MEDIO_DIA','FIN_DIA') NOT NULL DEFAULT 'MEDIO_DIA',
  `monto_efectivo` decimal(10,2) DEFAULT '0.00',
  `monto_yape` decimal(10,2) DEFAULT '0.00',
  `monto_tarjeta` decimal(10,2) DEFAULT '0.00',
  `monto_mixto` decimal(10,2) DEFAULT '0.00',
  `total_propinas` decimal(10,2) DEFAULT '0.00',
  `total_ventas` decimal(10,2) DEFAULT '0.00',
  `boletas_emitidas` int DEFAULT '0',
  `observaciones` text,
  `fecha_cierre` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Datos volcados para `cierres_caja` (5 registros)
INSERT INTO `cierres_caja` (`id`, `cajero_nombre`, `tipo_cierre`, `monto_efectivo`, `monto_yape`, `monto_tarjeta`, `monto_mixto`, `total_propinas`, `total_ventas`, `boletas_emitidas`, `observaciones`, `fecha_cierre`) VALUES (1, 'CAJERO', 'MEDIO_DIA', '207.00', '0.00', '0.00', '0.00', '0.00', '207.00', 4, NULL, '2026-10-12 22:48:49');
INSERT INTO `cierres_caja` (`id`, `cajero_nombre`, `tipo_cierre`, `monto_efectivo`, `monto_yape`, `monto_tarjeta`, `monto_mixto`, `total_propinas`, `total_ventas`, `boletas_emitidas`, `observaciones`, `fecha_cierre`) VALUES (2, 'CAJERO', 'MEDIO_DIA', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', 0, NULL, '2026-10-12 22:48:58');
INSERT INTO `cierres_caja` (`id`, `cajero_nombre`, `tipo_cierre`, `monto_efectivo`, `monto_yape`, `monto_tarjeta`, `monto_mixto`, `total_propinas`, `total_ventas`, `boletas_emitidas`, `observaciones`, `fecha_cierre`) VALUES (3, 'CAJERO', 'MEDIO_DIA', '67.00', '0.00', '0.00', '0.00', '0.00', '67.00', 1, NULL, '2026-10-12 23:14:32');
INSERT INTO `cierres_caja` (`id`, `cajero_nombre`, `tipo_cierre`, `monto_efectivo`, `monto_yape`, `monto_tarjeta`, `monto_mixto`, `total_propinas`, `total_ventas`, `boletas_emitidas`, `observaciones`, `fecha_cierre`) VALUES (4, 'CAJERO', 'MEDIO_DIA', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', 0, '', '2026-10-13 00:27:04');
INSERT INTO `cierres_caja` (`id`, `cajero_nombre`, `tipo_cierre`, `monto_efectivo`, `monto_yape`, `monto_tarjeta`, `monto_mixto`, `total_propinas`, `total_ventas`, `boletas_emitidas`, `observaciones`, `fecha_cierre`) VALUES (5, 'CAJERO', 'FIN_DIA', '233.00', '0.00', '0.00', '0.00', '0.00', '233.00', 3, '', '2026-10-13 00:27:10');

-- --------------------------------------------------------
-- Estructura de tabla: `clientes`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `clientes`;
CREATE TABLE `clientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dni` varchar(15) NOT NULL,
  `nombre` varchar(200) NOT NULL,
  `visitas` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero_documento` (`dni`),
  KEY `idx_doc` (`dni`)
) ENGINE=InnoDB AUTO_INCREMENT=163 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Datos volcados para `clientes` (82 registros)
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (1, '72839401', 'Juan Carlos Mendoza Silva', 5, '2026-10-12 22:35:55', '2026-10-12 23:17:09');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (2, '45892014', 'María Elena Quispe Rojas', 4, '2026-10-12 22:35:55', '2026-10-12 23:17:09');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (3, '10293847', 'Carlos Alberto Vargas Ríos', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (4, '78901234', 'Andrea Sofía Benavides Castro', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (5, '41239876', 'Pedro Pablo Huamán Gutiérrez', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (6, '09876543', 'Rosa Mercedes Chávez Torres', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (7, '73456789', 'Diego Armando Flores Sánchez', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (8, '46789012', 'Valeria Inés Morales Cárdenas', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (9, '15678901', 'Jorge Luis Tello Paredes', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (10, '70123456', 'Fiorella Patricia Rivas Medina', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (11, '48901234', 'Manuel Enrique Farfán Alva', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (12, '75678901', 'Camila Alejandra Vidal Romero', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (13, '43210987', 'Ricardo Javier Castillo Ortiz', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (14, '76789012', 'Luciana Belén Salazar Guerrero', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (15, '49012345', 'Gonzalo Mauricio Espinoza Paz', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (16, '71234567', 'Claudia Milagros Ramos Cruz', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (17, '44567890', 'Víctor Hugo Palacios León', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (18, '77890123', 'Stephanie Denisse Carrillo Soto', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (19, '42345678', 'Álvaro Sebastián Navarro Ruiz', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (20, '79012345', 'Gabriela Rocío Campos Vega', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (21, '20601234567', 'INVERSIONES GASTRONÓMICAS DEL SUR S.A.C.', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (22, '20519876543', 'CORPORACIÓN MARINA DEL PACÍFICO E.I.R.L.', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (23, '20100234567', 'SERVICIOS COMERCIALES LIMA NORTE S.A.', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (24, '20498765432', 'DISTRIBUIDORA Y LOGÍSTICA PERUANA S.A.C.', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (25, '20608765432', 'CONSULTORA EMPRESARIAL ANDINA S.A.C.', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (51, '47182934', 'Patricia Lucía Herrera Villacorta', 4, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (52, '70293841', 'Renato Alonso Salazar Montoya', 7, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (53, '42819304', 'Karina Paola Delgado Mendoza', 3, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (54, '74928103', 'Sebastián Ignacio Paredes Castro', 5, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (55, '41920384', 'Milagros del Carmen Rivas Quispe', 8, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (56, '76019283', 'Franco David Barrenechea Torres', 2, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (57, '43829104', 'Fiorella Beatríz Cárdenas Ponce', 9, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (58, '71829304', 'Gustavo Adolfo Palomino Silva', 6, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (59, '44910293', 'Lorena Isabel Alva Huamán', 4, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (60, '77019284', 'Rodrigo Andrés Céspedes Campos', 11, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (61, '45819203', 'Adriana Cecilia Romero Vega', 3, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (62, '72910384', 'Christian Enrique Gálvez Peña', 5, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (63, '46920193', 'Mariana Stefany Valdivia Cruz', 7, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (64, '78192034', 'Guillermo Tomás Benítez Ortiz', 2, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (65, '47910283', 'Daniela Alejandra Cáceres Soto', 6, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (66, '73829104', 'Mateo Emiliano Villegas Ruiz', 8, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (67, '48819203', 'Lucía Fernanda Quiroz León', 4, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (68, '79018293', 'Joaquín Marcelo Carranza Dávila', 10, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (69, '49829102', 'Brenda Vanessa Noriega Ramos', 3, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (70, '74819203', 'Eduardo Daniel Figueroa Tello', 5, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (71, '41029384', 'Carla Giuliana Medina Farfán', 6, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (72, '75920193', 'Álvaro Martín Zegarra Pacheco', 4, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (73, '42019283', 'Rocío del Pilar Villalobos Rey', 9, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (74, '76829104', 'Nicolás Alejandro Cuenca Bravo', 2, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (75, '43102938', 'Jessica Paola Samaniego Díaz', 7, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (76, '77910283', 'Alejandro Gabriel Prado Montero', 12, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (77, '44291029', 'Stephanie Beatriz Luján Morales', 5, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (78, '78829104', 'Héctor Manuel Córdova Ríos', 8, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (79, '45391029', 'Evelyn Roxana Guevara Tapia', 3, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (80, '79910283', 'Leonardo Favio Santillán Solís', 6, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (81, '46492019', 'Vanessa Carolina Quintana Vega', 4, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (82, '71029384', 'Bruno César Villacorta Luna', 7, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (83, '47581920', 'Tatiana María Obregón Silva', 5, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (84, '72102938', 'Mauricio Andrés Pinedo Guzmán', 9, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (85, '48692019', 'Wendy Elizabeth Hurtado Rosas', 3, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (86, '73201928', 'Esteban Rafael Montoya Arana', 11, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (87, '49781920', 'Silvia Teresa Balbuena Cano', 6, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (88, '74301928', 'Felipe Ignacio Carpio Bendezú', 4, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (89, '41892019', 'Cynthia Marisol Barreto Loayza', 8, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (90, '75401928', 'Gabriel Omar Valenzuela Rengifo', 5, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (91, '42981920', 'Gisella Katherine Ponce Viteri', 7, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (92, '76501928', 'Julio César Manrique Calderón', 3, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (93, '43092019', 'Ingrid Johana Espinal Chávez', 6, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (94, '77601928', 'Óscar Rodolfo Salcedo Ugarte', 10, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (95, '44192019', 'Katia Milena Castañeda Bernaola', 4, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (96, '20603456789', 'PESQUERA DEL CALLAO S.A.C.', 14, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (97, '20556789012', 'GRUPO GASTRONÓMICO MIRAFLORES S.R.L.', 8, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (98, '20451234567', 'COMERCIALIZADORA MARÍTIMA DEL PERÚ E.I.R.L.', 12, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (99, '20609876543', 'INVERSIONES SAN BORJA GOURMET S.A.C.', 6, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (100, '20501239874', 'DISTRIBUIDORA DE ALIMENTOS DEL PACÍFICO S.A.', 9, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (101, '20604567891', 'SERVICIOS HOTELEROS Y TURÍSTICOS LIMA S.A.C.', 5, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (102, '20523456781', 'TRANSPORTES Y LOGÍSTICA COSTERA E.I.R.L.', 7, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (103, '20607891234', 'CORPORACIÓN CULINARIA ANDINA S.A.C.', 11, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (104, '20489012345', 'INMOBILIARIA Y CONSTRUCTORA DEL SUR S.A.', 4, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (105, '20606789012', 'EVENTOS Y CATERING DON JULIO S.R.L.', 8, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (161, '88776655', 'Valeria Sofia Castro Paz', 1, '2026-10-12 23:07:38', '2026-10-12 23:07:38');
INSERT INTO `clientes` (`id`, `dni`, `nombre`, `visitas`, `created_at`, `updated_at`) VALUES (162, '73230029', 'Josue Manuel Lopez Coca', 1, '2026-10-12 23:12:18', '2026-10-12 23:12:18');

-- --------------------------------------------------------
-- Estructura de tabla: `compras_detalles`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `compras_detalles`;
CREATE TABLE `compras_detalles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `compra_id` int NOT NULL,
  `insumo_id` int NOT NULL,
  `cantidad` decimal(10,3) NOT NULL,
  `unidad_medida` varchar(20) NOT NULL,
  `costo_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `compra_id` (`compra_id`),
  CONSTRAINT `compras_detalles_ibfk_1` FOREIGN KEY (`compra_id`) REFERENCES `compras_proveedores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Estructura de tabla: `compras_proveedores`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `compras_proveedores`;
CREATE TABLE `compras_proveedores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `proveedor_nombre` varchar(150) NOT NULL,
  `proveedor_ruc` varchar(20) DEFAULT '',
  `tipo_comprobante` varchar(50) DEFAULT 'Factura',
  `serie_correlativo` varchar(50) DEFAULT '',
  `fecha_compra` date NOT NULL,
  `total_compra` decimal(10,2) NOT NULL DEFAULT '0.00',
  `usuario_id` int NOT NULL,
  `observaciones` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Estructura de tabla: `comprobantes`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `comprobantes`;
CREATE TABLE `comprobantes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pedido_id` int NOT NULL,
  `serie_correlativo` varchar(20) NOT NULL,
  `tipo_comprobante` enum('Boleta Simple','Boleta con DNI','Factura') DEFAULT 'Boleta Simple',
  `doc_cliente` varchar(20) DEFAULT NULL,
  `nombre_cliente` varchar(150) DEFAULT 'PÚBLICO GENERAL',
  `metodo_pago` varchar(50) NOT NULL DEFAULT 'Efectivo',
  `monto_recibido` decimal(10,2) DEFAULT '0.00',
  `vuelto` decimal(10,2) DEFAULT '0.00',
  `descuento` decimal(10,2) NOT NULL DEFAULT '0.00',
  `propina` decimal(10,2) DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL,
  `fecha_emision` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `pedido_id` (`pedido_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Datos volcados para `comprobantes` (5 registros)
INSERT INTO `comprobantes` (`id`, `pedido_id`, `serie_correlativo`, `tipo_comprobante`, `doc_cliente`, `nombre_cliente`, `metodo_pago`, `monto_recibido`, `vuelto`, `descuento`, `propina`, `total`, `fecha_emision`) VALUES (1, 1, 'F001-000001', 'Factura', '10761221441', 'CHAVITO MAS NA', 'Efectivo', '26.00', '0.00', '0.00', '0.00', '26.00', '2026-10-05 00:15:09');
INSERT INTO `comprobantes` (`id`, `pedido_id`, `serie_correlativo`, `tipo_comprobante`, `doc_cliente`, `nombre_cliente`, `metodo_pago`, `monto_recibido`, `vuelto`, `descuento`, `propina`, `total`, `fecha_emision`) VALUES (2, 2, 'B001-000002', 'Boleta Simple', '', 'PÚBLICO GENERAL', 'Efectivo', '15.00', '0.00', '0.00', '0.00', '15.00', '2026-10-05 00:15:56');
INSERT INTO `comprobantes` (`id`, `pedido_id`, `serie_correlativo`, `tipo_comprobante`, `doc_cliente`, `nombre_cliente`, `metodo_pago`, `monto_recibido`, `vuelto`, `descuento`, `propina`, `total`, `fecha_emision`) VALUES (3, 4, 'B001-000003', 'Boleta con DNI', '72839401', '', 'Efectivo', '119.00', '0.00', '0.00', '0.00', '119.00', '2026-10-12 22:48:30');
INSERT INTO `comprobantes` (`id`, `pedido_id`, `serie_correlativo`, `tipo_comprobante`, `doc_cliente`, `nombre_cliente`, `metodo_pago`, `monto_recibido`, `vuelto`, `descuento`, `propina`, `total`, `fecha_emision`) VALUES (4, 3, 'B001-000004', 'Boleta Simple', '', 'PÚBLICO GENERAL', 'Efectivo', '47.00', '0.00', '0.00', '0.00', '47.00', '2026-10-12 22:48:39');
INSERT INTO `comprobantes` (`id`, `pedido_id`, `serie_correlativo`, `tipo_comprobante`, `doc_cliente`, `nombre_cliente`, `metodo_pago`, `monto_recibido`, `vuelto`, `descuento`, `propina`, `total`, `fecha_emision`) VALUES (5, 5, 'B001-000005', 'Boleta con DNI', '73230029', 'Josue Manuel Lopez Coca', 'Efectivo', '67.00', '0.00', '0.00', '0.00', '67.00', '2026-10-12 23:12:18');

-- --------------------------------------------------------
-- Estructura de tabla: `detalles_pedido`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `detalles_pedido`;
CREATE TABLE `detalles_pedido` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pedido_id` int DEFAULT NULL,
  `producto_id` int DEFAULT NULL,
  `cantidad` int NOT NULL,
  `notas_cocina` text,
  `estado_cocina` varchar(20) DEFAULT 'Pendiente',
  PRIMARY KEY (`id`),
  KEY `pedido_id` (`pedido_id`),
  KEY `producto_id` (`producto_id`),
  CONSTRAINT `detalles_pedido_ibfk_1` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`),
  CONSTRAINT `detalles_pedido_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Datos volcados para `detalles_pedido` (19 registros)
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `notas_cocina`, `estado_cocina`) VALUES (1, 1, 4, 1, '', 'Pendiente');
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `notas_cocina`, `estado_cocina`) VALUES (2, 1, 3, 1, '', 'Despachado');
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `notas_cocina`, `estado_cocina`) VALUES (3, 2, 5, 1, '', 'Pendiente');
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `notas_cocina`, `estado_cocina`) VALUES (4, 2, 6, 1, '', 'Pendiente');
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `notas_cocina`, `estado_cocina`) VALUES (5, 3, 1, 1, '', 'Despachado');
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `notas_cocina`, `estado_cocina`) VALUES (6, 3, 2, 1, '', 'Despachado');
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `notas_cocina`, `estado_cocina`) VALUES (7, 4, 6, 4, '', 'Despachado');
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `notas_cocina`, `estado_cocina`) VALUES (8, 4, 25, 1, '', 'Despachado');
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `notas_cocina`, `estado_cocina`) VALUES (9, 4, 47, 1, '', 'Pendiente');
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `notas_cocina`, `estado_cocina`) VALUES (10, 4, 41, 1, '', 'Despachado');
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `notas_cocina`, `estado_cocina`) VALUES (11, 4, 23, 1, '', 'Despachado');
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `notas_cocina`, `estado_cocina`) VALUES (12, 4, 22, 1, '', 'Despachado');
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `notas_cocina`, `estado_cocina`) VALUES (13, 5, 24, 1, '', 'Despachado');
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `notas_cocina`, `estado_cocina`) VALUES (14, 5, 25, 1, '', 'Despachado');
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `notas_cocina`, `estado_cocina`) VALUES (15, 6, 25, 1, '', 'Despachado');
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `notas_cocina`, `estado_cocina`) VALUES (16, 6, 26, 1, '', 'Despachado');
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `notas_cocina`, `estado_cocina`) VALUES (17, 6, 6, 1, '', 'Pendiente');
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `notas_cocina`, `estado_cocina`) VALUES (18, 6, 51, 1, '', 'Pendiente');
INSERT INTO `detalles_pedido` (`id`, `pedido_id`, `producto_id`, `cantidad`, `notas_cocina`, `estado_cocina`) VALUES (19, 6, 75, 1, '', 'Despachado');

-- --------------------------------------------------------
-- Estructura de tabla: `insumos`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `insumos`;
CREATE TABLE `insumos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `unidad_medida` varchar(20) NOT NULL DEFAULT 'KG',
  `stock_actual` decimal(12,4) NOT NULL DEFAULT '0.0000',
  `stock_minimo` decimal(12,4) NOT NULL DEFAULT '0.0000',
  `costo_unitario` decimal(10,4) NOT NULL DEFAULT '0.0000',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=90 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Datos volcados para `insumos` (69 registros)
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (1, 'INS-PES-001', 'Pescado Corvina Fresco', 'Filete fresco para ceviches premium', 'KG', '18.5000', '5.0000', '32.0000', 1, '2026-10-12 21:08:01', '2026-10-13 00:04:08');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (2, 'INS-LIM-002', 'Limón Sutil Piurano', 'Limón fresco para extracción de jugo al momento', 'KG', '11.0000', '2.0000', '6.5000', 1, '2026-10-12 21:08:01', '2026-10-12 22:27:21');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (3, 'INS-CEB-003', 'Cebolla Morada', 'Cebolla corte juliana para ceviche', 'KG', '8.0000', '1.5000', '3.5000', 1, '2026-10-12 21:08:01', '2026-10-12 21:08:01');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (4, 'INS-AJI-004', 'Ají Limo', 'Ají limo fresco picado', 'KG', '2.0000', '0.5000', '12.0000', 1, '2026-10-12 21:08:01', '2026-10-12 21:08:01');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (5, 'INS-CAM-005', 'Camote Glaseado', 'Porciones de camote dulce cocido', 'UND', '40.0000', '10.0000', '0.8000', 1, '2026-10-12 21:08:01', '2026-10-12 21:08:01');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (6, 'INS-CHO-006', 'Choclo Desgranado', 'Choclo tierno desgranado cocido', 'KG', '5.0000', '1.0000', '7.0000', 1, '2026-10-12 21:08:01', '2026-10-12 21:08:01');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (7, 'INS-BEB-001', 'Inca Kola 1L', 'Botella de cerveza Pilsen fría', 'UND', '24.0000', '12.0000', '6.5000', 1, '2026-10-12 21:08:01', '2026-10-13 00:04:52');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (8, 'INS-CER-001', 'Cusqueña Trigo 330ml', 'Cerveza en botella', 'UND', '24.0000', '12.0000', '6.0000', 1, '2026-10-12 21:08:01', '2026-10-12 23:27:10');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (9, 'INS-HEL-001', 'Helado de Vainilla', 'Porción de helado artesanal', 'PORCION', '20.0000', '5.0000', '2.5000', 1, '2026-10-12 21:08:01', '2026-10-12 21:08:01');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (10, 'INS-MAR-007', 'Mixtura de Mariscos (Pulpo, Calamar, Langostino)', 'Cangrejos enteros para chilcanos y parihuelas', 'UND', '25.0000', '10.0000', '3.5000', 1, '2026-10-12 22:35:55', '2026-10-13 00:04:51');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (11, 'INS-POT-008', 'Pota Fresca Laminada', 'Pota fresca para chicharrón y ceviche carretillero', 'KG', '20.0000', '4.0000', '14.0000', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (12, 'INS-ARR-009', 'Arroz Extra Añejo', 'Arroz de grano largo graneado para arroces marinos', 'KG', '50.0000', '20.0000', '4.2000', 1, '2026-10-12 22:35:55', '2026-10-13 00:04:52');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (13, 'INS-AJI-010', 'Pasta de Ají Amarillo', 'Pasta concentrada de ají amarillo', 'KG', '12.0000', '3.0000', '8.5000', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (14, 'INS-ROC-011', 'Pasta de Rocoto', 'Pasta de rocoto sin venas para tiraditos', 'KG', '8.0000', '2.0000', '9.0000', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (15, 'INS-CIL-012', 'Culantro Fresco Picado', 'Culantro fresco aromático', 'KG', '4.0000', '1.0000', '6.0000', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (16, 'INS-CON-013', 'Conchas Negras Frescas', 'Conchas negras de Tumbes vivas', 'UND', '120.0000', '24.0000', '1.8000', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (17, 'INS-YUC-014', 'Yuca Frita / Sancochada', 'Porciones de yuca amarilla suave', 'KG', '25.0000', '5.0000', '3.8000', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (18, 'INS-CAR-015', 'Lomo Fino de Res', 'Cortes de lomo fino para saltado', 'KG', '15.0000', '3.0000', '42.0000', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (19, 'INS-TOM-016', 'Tomate Chanchamayo', 'Tomate gajos gruesos para lomo saltado', 'KG', '10.0000', '2.0000', '3.2000', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (20, 'INS-PAP-017', 'Papas Amarillas / Fritas', 'Papa bastón crocante', 'KG', '30.0000', '8.0000', '3.5000', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (21, 'INS-SIY-018', 'Sillao Oscuro / Salsa Ostión', 'Salsa de soya oriental', 'LT', '10.0000', '2.0000', '7.5000', 1, '2026-10-12 22:35:55', '2026-10-12 22:35:55');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (34, 'INS-022', 'Pisco Quebranta (Puro)', 'Pisco peruano 100% puro para cócteles y flameados', 'LT', '25.0000', '5.0000', '32.0000', 1, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (35, 'INS-023', 'Conchas de Abanico Seleccionadas', 'Conchas frescas con coral para parmesana y tiraditos', 'UND', '120.0000', '30.0000', '1.8000', 1, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (36, 'INS-024', 'Queso Parmesano Rallado', 'Queso madurado de alta calidad para gratinados', 'KG', '8.0000', '2.0000', '45.0000', 1, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (37, 'INS-025', 'Palta Fuerte de Exportación', 'Palta cremosa para causas, tiraditos y ensaladas', 'KG', '18.0000', '4.0000', '9.5000', 1, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (38, 'INS-026', 'Salsa de Soya (Sillao Especial)', 'Sillao oscuro premium para chaufa y tiraditos nikkei', 'LT', '15.0000', '3.0000', '14.0000', 1, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (39, 'INS-027', 'Aceite de Ajonjolí Tostado', 'Aceite aromático oriental para cocina marina nikkei', 'LT', '4.0000', '1.5000', '28.0000', 1, '2026-10-12 22:56:24', '2026-10-12 23:16:04');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (40, 'INS-028', 'Jarabe de Goma Artesanal', 'Almíbar de caña de azúcar para cócteles y sours', 'LT', '20.0000', '5.0000', '10.0000', 1, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (41, 'INS-029', 'Maracuyá Pulpa Pura', 'Extracto natural de maracuyá 100% concentrado', 'LT', '30.0000', '8.0000', '12.0000', 1, '2026-10-12 22:56:24', '2026-10-12 22:56:24');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (50, 'INS-PES-002', 'Pescado Lenguado Fresco', 'Filete fino para tiraditos y ceviches de autor', 'KG', '12.0000', '3.0000', '45.0000', 1, '2026-10-13 00:04:08', '2026-10-13 00:04:08');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (51, 'INS-PES-003', 'Pescado Bonito Fresco', 'Pescado azul para chicharrones y sudados', 'KG', '30.0000', '8.0000', '14.0000', 1, '2026-10-13 00:04:08', '2026-10-13 00:04:08');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (52, 'INS-PES-004', 'Pescado Cabrilla Entero', 'Pescado entero para sudados norteños y fritos', 'KG', '18.0000', '4.0000', '22.0000', 1, '2026-10-13 00:04:08', '2026-10-13 00:04:08');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (53, 'INS-PES-005', 'Pescado Jurel Fresco', 'Pescado fresco para frituras y caldos', 'KG', '20.0000', '5.0000', '12.0000', 1, '2026-10-13 00:04:08', '2026-10-13 00:04:08');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (54, 'INS-MAR-001', 'Mixtura de Mariscos Fresca', 'Pulpo, calamar, langostino y almejas para arroces y jaleas', 'KG', '28.0000', '6.0000', '26.0000', 1, '2026-10-13 00:04:08', '2026-10-13 00:04:08');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (55, 'INS-MAR-002', 'Langostinos Pelados y Desvenados', 'Colitas de langostino para ceviches mixtos y chaufa', 'KG', '15.0000', '4.0000', '34.0000', 1, '2026-10-13 00:04:08', '2026-10-13 00:04:08');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (56, 'INS-MAR-003', 'Pulpo Entero Fresco', 'Pulpo entero para cocinar al olivo y parrilla', 'KG', '14.0000', '3.0000', '38.0000', 1, '2026-10-13 00:04:08', '2026-10-13 00:04:08');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (57, 'INS-MAR-004', 'Pota Fresca Marina', 'Pota fresca seleccionada para chicharrones', 'KG', '25.0000', '5.0000', '8.5000', 1, '2026-10-13 00:04:08', '2026-10-13 00:04:08');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (58, 'INS-MAR-005', 'Conchas de Abanico con Coral', 'Conchas de abanico frescas', 'UND', '120.0000', '30.0000', '1.5000', 1, '2026-10-13 00:04:08', '2026-10-13 00:04:08');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (59, 'INS-MAR-006', 'Conchas Negras de Tumbes', 'Conchas negras vivas para ceviche de conchas negras', 'DOCENA', '20.0000', '5.0000', '28.0000', 1, '2026-10-13 00:04:51', '2026-10-13 00:04:51');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (60, 'INS-VER-001', 'Limón Sutil Norteño', 'Limón jugoso recién exprimido al momento', 'KG', '45.0000', '10.0000', '5.5000', 1, '2026-10-13 00:04:51', '2026-10-13 00:04:51');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (61, 'INS-VER-002', 'Cebolla Roja Seleccionada', 'Cebolla roja cortada en pluma crocante', 'KG', '35.0000', '8.0000', '3.2000', 1, '2026-10-13 00:04:51', '2026-10-13 00:04:51');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (62, 'INS-VER-003', 'Ají Limo Fresco', 'Ají limo rojo y amarillo sin pepas', 'KG', '8.0000', '2.0000', '12.0000', 1, '2026-10-13 00:04:51', '2026-10-13 00:04:51');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (63, 'INS-VER-004', 'Culantro Fresco', 'Hojas frescas picadas finamente', 'KG', '6.0000', '1.5000', '7.0000', 1, '2026-10-13 00:04:51', '2026-10-13 00:04:51');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (64, 'INS-VER-005', 'Apio Fresco Trozado', 'Tallos frescos de apio para base de leche de tigre', 'KG', '8.0000', '2.0000', '4.5000', 1, '2026-10-13 00:04:51', '2026-10-13 00:04:51');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (65, 'INS-VER-006', 'Kión (Jengibre) Fresco', 'Kión fresco rallado para saborizante marino', 'KG', '5.0000', '1.0000', '9.0000', 1, '2026-10-13 00:04:51', '2026-10-13 00:04:51');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (66, 'INS-VER-007', 'Ajo Fresco Molido', 'Pasta natural de ajo recién molido', 'KG', '12.0000', '3.0000', '11.0000', 1, '2026-10-13 00:04:51', '2026-10-13 00:04:51');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (67, 'INS-VER-008', 'Pasta de Ají Amarillo Casero', 'Ají amarillo desvenado y licuado al natural', 'KG', '15.0000', '3.0000', '8.0000', 1, '2026-10-13 00:04:51', '2026-10-13 00:04:51');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (68, 'INS-VER-009', 'Pasta de Ají Panca', 'Ají panca especial para parihuelas y sudados', 'KG', '10.0000', '2.0000', '9.5000', 1, '2026-10-13 00:04:51', '2026-10-13 00:04:51');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (69, 'INS-VER-010', 'Camote Glaseado / Sancochado', 'Camote dulce amarillo para acompañamiento', 'KG', '30.0000', '6.0000', '3.0000', 1, '2026-10-13 00:04:51', '2026-10-13 00:04:51');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (70, 'INS-VER-011', 'Choclo Desgranado Gigante', 'Choclo cusqueño cocido tierno', 'KG', '25.0000', '5.0000', '4.8000', 1, '2026-10-13 00:04:51', '2026-10-13 00:04:51');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (71, 'INS-VER-012', 'Yuca Amarilla Para Freír', 'Yuca frita crocante por fuera y suave por dentro', 'KG', '35.0000', '8.0000', '3.5000', 1, '2026-10-13 00:04:51', '2026-10-13 00:04:51');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (72, 'INS-VER-013', 'Canchita Serrana Chulpi', 'Maíz tostado al punto crocante', 'KG', '20.0000', '4.0000', '8.0000', 1, '2026-10-13 00:04:51', '2026-10-13 00:04:51');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (73, 'INS-VER-014', 'Chicha de Jora Marina', 'Chicha fermentada para sudados y secos', 'LT', '15.0000', '3.0000', '4.0000', 1, '2026-10-13 00:04:52', '2026-10-13 00:04:52');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (74, 'INS-VER-015', 'Tomate Italiano', 'Tomates frescos para aderezo y ensaladas criollas', 'KG', '15.0000', '3.0000', '3.8000', 1, '2026-10-13 00:04:52', '2026-10-13 00:04:52');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (75, 'INS-ABA-002', 'Harina de Trigo Especial', 'Harina para apanado de jaleas y chicharrones', 'KG', '30.0000', '8.0000', '3.6000', 1, '2026-10-13 00:04:52', '2026-10-13 00:04:52');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (76, 'INS-ABA-003', 'Chuño (Fécula de Maíz)', 'Chuño fino para textura crocante en frituras', 'KG', '18.0000', '4.0000', '5.0000', 1, '2026-10-13 00:04:52', '2026-10-13 00:04:52');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (77, 'INS-ABA-004', 'Huevo Fresco de Gallina', 'Huevos de gallina para batidos de frituras', 'UND', '90.0000', '20.0000', '0.6500', 1, '2026-10-13 00:04:52', '2026-10-13 00:04:52');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (78, 'INS-ABA-005', 'Aceite Vegetal Premium', 'Aceite vegetal para frituras profundas', 'LT', '50.0000', '12.0000', '7.2000', 1, '2026-10-13 00:04:52', '2026-10-13 00:04:52');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (79, 'INS-ABA-006', 'Sillao (Salsa de Soya)', 'Salsa de soya oscura para chaufas y salteados', 'LT', '12.0000', '3.0000', '8.5000', 1, '2026-10-13 00:04:52', '2026-10-13 00:04:52');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (80, 'INS-ABA-007', 'Aceite de Ajonjolí', 'Aceite aromático de sésamo para chaufa', 'LT', '4.0000', '1.0000', '24.0000', 1, '2026-10-13 00:04:52', '2026-10-13 00:04:52');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (81, 'INS-ABA-008', 'Fondo Concentrado de Pescado', 'Caldo base de cabezas y espinazos para caldos', 'LT', '30.0000', '8.0000', '2.0000', 1, '2026-10-13 00:04:52', '2026-10-13 00:04:52');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (82, 'INS-ABA-009', 'Sal Marina Yodada', 'Sal fina para sazón general', 'KG', '25.0000', '5.0000', '1.8000', 1, '2026-10-13 00:04:52', '2026-10-13 00:04:52');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (83, 'INS-ABA-010', 'Ajinomoto (Glutamato)', 'Sazonador umami tradicional', 'KG', '8.0000', '2.0000', '14.0000', 1, '2026-10-13 00:04:52', '2026-10-13 00:04:52');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (84, 'INS-ABA-011', 'Leche Evaporada', 'Leche evaporada para leche de tigre cremosa y chupes', 'LATA', '36.0000', '8.0000', '4.2000', 1, '2026-10-13 00:04:52', '2026-10-13 00:04:52');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (85, 'INS-BEB-002', 'Cerveza Cusqueña Trigo 620ml', 'Botella de cerveza Cusqueña Trigo', 'UND', '36.0000', '10.0000', '7.2000', 1, '2026-10-13 00:04:52', '2026-10-13 00:04:52');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (86, 'INS-BEB-003', 'Gaseosa Inka Kola 500ml', 'Botella personal Inka Kola', 'UND', '60.0000', '15.0000', '2.5000', 1, '2026-10-13 00:04:52', '2026-10-13 00:04:52');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (87, 'INS-BEB-004', 'Gaseosa Coca Cola 500ml', 'Botella personal Coca Cola', 'UND', '48.0000', '12.0000', '2.5000', 1, '2026-10-13 00:04:52', '2026-10-13 00:04:52');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (88, 'INS-BEB-005', 'Jarra de Chicha Morada 1L', 'Chicha natural con maíz morado y frutas', 'UND', '25.0000', '5.0000', '3.5000', 1, '2026-10-13 00:04:52', '2026-10-13 00:04:52');
INSERT INTO `insumos` (`id`, `codigo`, `nombre`, `descripcion`, `unidad_medida`, `stock_actual`, `stock_minimo`, `costo_unitario`, `activo`, `created_at`, `updated_at`) VALUES (89, 'INS-BEB-006', 'Jarra de Maracuyá 1L', 'Maracuyá natural helado', 'UND', '20.0000', '5.0000', '3.5000', 1, '2026-10-13 00:04:52', '2026-10-13 00:04:52');

-- --------------------------------------------------------
-- Estructura de tabla: `kardex`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `kardex`;
CREATE TABLE `kardex` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `insumo_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `tipo_movimiento` enum('ENTRADA_COMPRA','SALIDA_VENTA','SALIDA_MERMA','AJUSTE_POSITIVO','AJUSTE_NEGATIVO') NOT NULL,
  `cantidad` decimal(12,4) NOT NULL,
  `stock_anterior` decimal(12,4) NOT NULL,
  `stock_nuevo` decimal(12,4) NOT NULL,
  `costo_unitario` decimal(10,4) NOT NULL DEFAULT '0.0000',
  `referencia_id` int DEFAULT NULL,
  `motivo` varchar(255) NOT NULL,
  `fecha_hora` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `idx_kardex_insumo_fecha` (`insumo_id`,`fecha_hora`),
  CONSTRAINT `kardex_ibfk_1` FOREIGN KEY (`insumo_id`) REFERENCES `insumos` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `kardex_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Datos volcados para `kardex` (46 registros)
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (1, 2, 1, 'AJUSTE_POSITIVO', '1.0000', '10.0000', '11.0000', '6.5000', NULL, 'Ingreso de compra adicional no registrada', '2026-10-12 22:27:21');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (2, 8, 1, 'AJUSTE_NEGATIVO', '5.0000', '30.0000', '25.0000', '6.0000', NULL, 'Merma por deterioro / vencimiento', '2026-10-12 22:45:26');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (3, 1, 1, 'ENTRADA_COMPRA', '5.0000', '15.0000', '20.0000', '32.0000', NULL, 'Compra de pescado fresco al proveedor', '2026-10-12 23:06:49');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (4, 1, 1, 'SALIDA_MERMA', '1.5000', '20.0000', '18.5000', '32.0000', NULL, 'Merma por fileteo / corte de pescado', '2026-10-12 23:06:58');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (5, 39, 1, 'AJUSTE_NEGATIVO', '2.0000', '6.0000', '4.0000', '28.0000', NULL, 'Corrección de inventario', '2026-10-12 23:16:04');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (6, 8, 2, 'SALIDA_VENTA', '1.0000', '25.0000', '24.0000', '6.0000', 6, 'Salida por Comanda Pedido #6 (Mesa 1)', '2026-10-12 23:27:10');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (7, 50, 1, 'AJUSTE_POSITIVO', '12.0000', '0.0000', '12.0000', '45.0000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:08');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (8, 51, 1, 'AJUSTE_POSITIVO', '30.0000', '0.0000', '30.0000', '14.0000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:08');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (9, 52, 1, 'AJUSTE_POSITIVO', '18.0000', '0.0000', '18.0000', '22.0000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:08');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (10, 53, 1, 'AJUSTE_POSITIVO', '20.0000', '0.0000', '20.0000', '12.0000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:08');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (11, 54, 1, 'AJUSTE_POSITIVO', '28.0000', '0.0000', '28.0000', '26.0000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:08');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (12, 55, 1, 'AJUSTE_POSITIVO', '15.0000', '0.0000', '15.0000', '34.0000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:08');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (13, 56, 1, 'AJUSTE_POSITIVO', '14.0000', '0.0000', '14.0000', '38.0000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:08');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (14, 57, 1, 'AJUSTE_POSITIVO', '25.0000', '0.0000', '25.0000', '8.5000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:08');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (15, 58, 1, 'AJUSTE_POSITIVO', '120.0000', '0.0000', '120.0000', '1.5000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:08');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (16, 59, 1, 'AJUSTE_POSITIVO', '20.0000', '0.0000', '20.0000', '28.0000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:51');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (17, 60, 1, 'AJUSTE_POSITIVO', '45.0000', '0.0000', '45.0000', '5.5000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:51');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (18, 61, 1, 'AJUSTE_POSITIVO', '35.0000', '0.0000', '35.0000', '3.2000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:51');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (19, 62, 1, 'AJUSTE_POSITIVO', '8.0000', '0.0000', '8.0000', '12.0000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:51');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (20, 63, 1, 'AJUSTE_POSITIVO', '6.0000', '0.0000', '6.0000', '7.0000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:51');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (21, 64, 1, 'AJUSTE_POSITIVO', '8.0000', '0.0000', '8.0000', '4.5000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:51');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (22, 65, 1, 'AJUSTE_POSITIVO', '5.0000', '0.0000', '5.0000', '9.0000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:51');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (23, 66, 1, 'AJUSTE_POSITIVO', '12.0000', '0.0000', '12.0000', '11.0000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:51');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (24, 67, 1, 'AJUSTE_POSITIVO', '15.0000', '0.0000', '15.0000', '8.0000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:51');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (25, 68, 1, 'AJUSTE_POSITIVO', '10.0000', '0.0000', '10.0000', '9.5000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:51');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (26, 69, 1, 'AJUSTE_POSITIVO', '30.0000', '0.0000', '30.0000', '3.0000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:51');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (27, 70, 1, 'AJUSTE_POSITIVO', '25.0000', '0.0000', '25.0000', '4.8000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:51');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (28, 71, 1, 'AJUSTE_POSITIVO', '35.0000', '0.0000', '35.0000', '3.5000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:51');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (29, 72, 1, 'AJUSTE_POSITIVO', '20.0000', '0.0000', '20.0000', '8.0000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:51');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (30, 73, 1, 'AJUSTE_POSITIVO', '15.0000', '0.0000', '15.0000', '4.0000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:52');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (31, 74, 1, 'AJUSTE_POSITIVO', '15.0000', '0.0000', '15.0000', '3.8000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:52');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (32, 75, 1, 'AJUSTE_POSITIVO', '30.0000', '0.0000', '30.0000', '3.6000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:52');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (33, 76, 1, 'AJUSTE_POSITIVO', '18.0000', '0.0000', '18.0000', '5.0000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:52');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (34, 77, 1, 'AJUSTE_POSITIVO', '90.0000', '0.0000', '90.0000', '0.6500', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:52');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (35, 78, 1, 'AJUSTE_POSITIVO', '50.0000', '0.0000', '50.0000', '7.2000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:52');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (36, 79, 1, 'AJUSTE_POSITIVO', '12.0000', '0.0000', '12.0000', '8.5000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:52');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (37, 80, 1, 'AJUSTE_POSITIVO', '4.0000', '0.0000', '4.0000', '24.0000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:52');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (38, 81, 1, 'AJUSTE_POSITIVO', '30.0000', '0.0000', '30.0000', '2.0000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:52');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (39, 82, 1, 'AJUSTE_POSITIVO', '25.0000', '0.0000', '25.0000', '1.8000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:52');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (40, 83, 1, 'AJUSTE_POSITIVO', '8.0000', '0.0000', '8.0000', '14.0000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:52');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (41, 84, 1, 'AJUSTE_POSITIVO', '36.0000', '0.0000', '36.0000', '4.2000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:52');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (42, 85, 1, 'AJUSTE_POSITIVO', '36.0000', '0.0000', '36.0000', '7.2000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:52');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (43, 86, 1, 'AJUSTE_POSITIVO', '60.0000', '0.0000', '60.0000', '2.5000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:52');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (44, 87, 1, 'AJUSTE_POSITIVO', '48.0000', '0.0000', '48.0000', '2.5000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:52');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (45, 88, 1, 'AJUSTE_POSITIVO', '25.0000', '0.0000', '25.0000', '3.5000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:52');
INSERT INTO `kardex` (`id`, `insumo_id`, `usuario_id`, `tipo_movimiento`, `cantidad`, `stock_anterior`, `stock_nuevo`, `costo_unitario`, `referencia_id`, `motivo`, `fecha_hora`) VALUES (46, 89, 1, 'AJUSTE_POSITIVO', '20.0000', '0.0000', '20.0000', '3.5000', NULL, 'Inventario Inicial de Super BD', '2026-10-13 00:04:52');

-- --------------------------------------------------------
-- Estructura de tabla: `mermas`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `mermas`;
CREATE TABLE `mermas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `insumo_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `turno_id` int DEFAULT NULL,
  `cantidad` decimal(12,4) NOT NULL,
  `motivo` enum('VENCIMIENTO','DETERIORO','ACCIDENTE_COCINA','DESCONGELAMIENTO','OTRO') NOT NULL,
  `comentario` text,
  `fecha_hora` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `insumo_id` (`insumo_id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `turno_id` (`turno_id`),
  CONSTRAINT `mermas_ibfk_1` FOREIGN KEY (`insumo_id`) REFERENCES `insumos` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `mermas_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `mermas_ibfk_3` FOREIGN KEY (`turno_id`) REFERENCES `turnos_caja` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Datos volcados para `mermas` (1 registros)
INSERT INTO `mermas` (`id`, `insumo_id`, `usuario_id`, `turno_id`, `cantidad`, `motivo`, `comentario`, `fecha_hora`) VALUES (1, 1, 1, NULL, '1.5000', 'DETERIORO', 'Merma por fileteo / corte de pescado', '2026-10-12 23:06:58');

-- --------------------------------------------------------
-- Estructura de tabla: `mesas`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `mesas`;
CREATE TABLE `mesas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `estado` varchar(20) DEFAULT 'Libre',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Datos volcados para `mesas` (15 registros)
INSERT INTO `mesas` (`id`, `nombre`, `estado`) VALUES (1, 'Mesa 1', 'Ocupada');
INSERT INTO `mesas` (`id`, `nombre`, `estado`) VALUES (2, 'Mesa 2', 'Libre');
INSERT INTO `mesas` (`id`, `nombre`, `estado`) VALUES (3, 'Mesa 3', 'Libre');
INSERT INTO `mesas` (`id`, `nombre`, `estado`) VALUES (4, 'Mesa 4', 'Libre');
INSERT INTO `mesas` (`id`, `nombre`, `estado`) VALUES (5, 'Mesa 5', 'Libre');
INSERT INTO `mesas` (`id`, `nombre`, `estado`) VALUES (6, 'Mesa 6', 'Libre');
INSERT INTO `mesas` (`id`, `nombre`, `estado`) VALUES (7, 'Mesa 7', 'Libre');
INSERT INTO `mesas` (`id`, `nombre`, `estado`) VALUES (8, 'Mesa 8', 'Libre');
INSERT INTO `mesas` (`id`, `nombre`, `estado`) VALUES (9, 'Mesa 9', 'Libre');
INSERT INTO `mesas` (`id`, `nombre`, `estado`) VALUES (10, 'Mesa 10', 'Libre');
INSERT INTO `mesas` (`id`, `nombre`, `estado`) VALUES (11, 'Mesa 11', 'Libre');
INSERT INTO `mesas` (`id`, `nombre`, `estado`) VALUES (12, 'Mesa 12', 'Libre');
INSERT INTO `mesas` (`id`, `nombre`, `estado`) VALUES (13, 'Mesa 13', 'Libre');
INSERT INTO `mesas` (`id`, `nombre`, `estado`) VALUES (14, 'Mesa 14', 'Libre');
INSERT INTO `mesas` (`id`, `nombre`, `estado`) VALUES (15, 'Mesa 15', 'Libre');

-- --------------------------------------------------------
-- Estructura de tabla: `pagos`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `pagos`;
CREATE TABLE `pagos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pedido_id` int NOT NULL,
  `turno_id` int NOT NULL,
  `cajero_id` int NOT NULL,
  `metodo_pago` varchar(50) NOT NULL DEFAULT 'Efectivo',
  `monto` decimal(10,2) NOT NULL,
  `propina` decimal(10,2) DEFAULT '0.00',
  `numero_operacion` varchar(50) DEFAULT NULL,
  `fecha_pago` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pedido_pago_unico` (`pedido_id`),
  KEY `turno_id` (`turno_id`),
  KEY `cajero_id` (`cajero_id`),
  CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `pagos_ibfk_2` FOREIGN KEY (`turno_id`) REFERENCES `turnos_caja` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `pagos_ibfk_3` FOREIGN KEY (`cajero_id`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Estructura de tabla: `pedidos`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `pedidos`;
CREATE TABLE `pedidos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo_pedido` varchar(50) DEFAULT 'Mesa',
  `mesa_id` int DEFAULT NULL,
  `turno_id` int DEFAULT NULL,
  `usuario_mesero_id` int DEFAULT NULL,
  `cerrado_por_usuario_id` int DEFAULT NULL,
  `nombre_cliente` varchar(100) DEFAULT NULL,
  `estado_global` varchar(20) DEFAULT 'Abierto',
  `total` decimal(10,2) DEFAULT '0.00',
  `version` int NOT NULL DEFAULT '1',
  `fecha_hora` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_cierre` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `mesa_id` (`mesa_id`),
  KEY `fk_pedidos_turno` (`turno_id`),
  KEY `fk_pedidos_mesero` (`usuario_mesero_id`),
  KEY `fk_pedidos_cierre` (`cerrado_por_usuario_id`),
  CONSTRAINT `fk_pedidos_cierre` FOREIGN KEY (`cerrado_por_usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pedidos_mesero` FOREIGN KEY (`usuario_mesero_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pedidos_turno` FOREIGN KEY (`turno_id`) REFERENCES `turnos_caja` (`id`) ON DELETE SET NULL,
  CONSTRAINT `pedidos_ibfk_1` FOREIGN KEY (`mesa_id`) REFERENCES `mesas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Datos volcados para `pedidos` (6 registros)
INSERT INTO `pedidos` (`id`, `tipo_pedido`, `mesa_id`, `turno_id`, `usuario_mesero_id`, `cerrado_por_usuario_id`, `nombre_cliente`, `estado_global`, `total`, `version`, `fecha_hora`, `fecha_cierre`) VALUES (1, 'Mesa', 9, NULL, NULL, NULL, 'arian', 'Cerrado', '26.00', 1, '2026-10-05 00:10:48', NULL);
INSERT INTO `pedidos` (`id`, `tipo_pedido`, `mesa_id`, `turno_id`, `usuario_mesero_id`, `cerrado_por_usuario_id`, `nombre_cliente`, `estado_global`, `total`, `version`, `fecha_hora`, `fecha_cierre`) VALUES (2, 'Mesa', 2, NULL, NULL, NULL, 'arian', 'Cerrado', '15.00', 1, '2026-10-05 00:11:34', NULL);
INSERT INTO `pedidos` (`id`, `tipo_pedido`, `mesa_id`, `turno_id`, `usuario_mesero_id`, `cerrado_por_usuario_id`, `nombre_cliente`, `estado_global`, `total`, `version`, `fecha_hora`, `fecha_cierre`) VALUES (3, 'Mesa', 6, NULL, NULL, 5, 'arian', 'Cerrado', '47.00', 2, '2026-10-05 00:13:12', '2026-10-12 22:48:39');
INSERT INTO `pedidos` (`id`, `tipo_pedido`, `mesa_id`, `turno_id`, `usuario_mesero_id`, `cerrado_por_usuario_id`, `nombre_cliente`, `estado_global`, `total`, `version`, `fecha_hora`, `fecha_cierre`) VALUES (4, 'Mesa', 1, NULL, NULL, 5, 'arian', 'Cerrado', '119.00', 3, '2026-10-05 00:23:05', '2026-10-12 22:48:30');
INSERT INTO `pedidos` (`id`, `tipo_pedido`, `mesa_id`, `turno_id`, `usuario_mesero_id`, `cerrado_por_usuario_id`, `nombre_cliente`, `estado_global`, `total`, `version`, `fecha_hora`, `fecha_cierre`) VALUES (5, 'Mesa', 8, NULL, 2, 5, 'Mesero 1', 'Cerrado', '67.00', 2, '2026-10-12 23:09:59', '2026-10-12 23:12:18');
INSERT INTO `pedidos` (`id`, `tipo_pedido`, `mesa_id`, `turno_id`, `usuario_mesero_id`, `cerrado_por_usuario_id`, `nombre_cliente`, `estado_global`, `total`, `version`, `fecha_hora`, `fecha_cierre`) VALUES (6, 'Mesa', 1, NULL, 2, NULL, 'Mesero 1', 'Abierto', '115.00', 1, '2026-10-12 23:27:10', NULL);

-- --------------------------------------------------------
-- Estructura de tabla: `productos`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `productos`;
CREATE TABLE `productos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `costo_estimado` decimal(10,2) DEFAULT '0.00',
  `categoria_id` int DEFAULT NULL,
  `tipo_producto` enum('DIRECTO','PREPARADO') NOT NULL DEFAULT 'PREPARADO',
  `insumo_directo_id` int DEFAULT NULL,
  `disponible` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `categoria_id` (`categoria_id`),
  KEY `fk_productos_insumo_directo` (`insumo_directo_id`),
  CONSTRAINT `fk_productos_insumo_directo` FOREIGN KEY (`insumo_directo_id`) REFERENCES `insumos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=86 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Datos volcados para `productos` (85 registros)
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (1, 'Ceviche Mixto', '25.00', '0.00', 1, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (2, 'Lomo Saltado', '22.00', '0.00', 1, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (3, 'Arroz con Pollo', '18.00', '0.00', 1, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (4, 'Inca Kola 1L', '8.00', '0.00', 2, 'DIRECTO', 7, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (5, 'Limonada Frozen', '6.00', '0.00', 3, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (6, 'Cusqueña Trigo', '9.00', '0.00', 4, 'DIRECTO', 8, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (7, 'Helado de Vainilla', '5.00', '0.00', 5, 'DIRECTO', 9, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (8, 'Cebiche de Pescado Clásico', '28.00', '0.00', 7, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (9, 'Cebiche Mixto Especial', '35.00', '0.00', 7, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (10, 'Cebiche de Conchas Negras', '38.00', '0.00', 7, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (11, 'Cebiche Carretillero (con Chicharrón de Pota)', '32.00', '0.00', 7, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (12, 'Tiradito al Ají Amarillo', '30.00', '0.00', 8, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (13, 'Tiradito al Rocoto', '32.00', '0.00', 8, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (14, 'Tiradito Tres Sabores', '35.00', '0.00', 8, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (15, 'Leche de Tigre Clásica', '15.00', '0.00', 9, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (16, 'Leche de Tigre Mixta', '20.00', '0.00', 9, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (17, 'Leche de Pantera (con Conchas Negras)', '25.00', '0.00', 9, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (18, 'Causa de Pulpa de Cangrejo', '22.00', '0.00', 10, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (19, 'Causa Limeña de Pollo', '18.00', '0.00', 10, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (20, 'Chicharrón de Calamar', '35.00', '0.00', 10, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (21, 'Chicharrón de Pescado', '30.00', '0.00', 10, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (22, 'Choros a la Chalaca (1/2 Docena)', '18.00', '0.00', 10, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (23, 'Tequeños de Queso', '15.00', '0.00', 10, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (24, 'Arroz con Mariscos', '35.00', '0.00', 12, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (25, 'Arroz Chaufa de Mariscos', '32.00', '0.00', 12, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (26, 'Arroz Chaufa de Pescado', '28.00', '0.00', 12, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (27, 'Tacu Tacu con Salsa de Mariscos', '38.00', '0.00', 11, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (28, 'Picante de Mariscos', '35.00', '0.00', 11, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (29, 'Jalea Mixta Familiar', '55.00', '0.00', 11, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (30, 'Parihuela', '38.00', '0.00', 13, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (31, 'Chupe de Camarones', '45.00', '0.00', 13, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (32, 'Chilcano de Pescado', '15.00', '0.00', 13, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (33, 'Sudado de Pescado (Tramboyo)', '35.00', '0.00', 14, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (34, 'Sudado Mixto', '40.00', '0.00', 14, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (35, 'Lomo Saltado a lo Pobre', '35.00', '0.00', 15, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (36, 'Tallarín Saltado de Carne', '28.00', '0.00', 15, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (37, 'Pollo a la Plancha', '22.00', '0.00', 15, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (38, 'Porción de Arroz Blanco', '5.00', '0.00', 16, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (39, 'Porción de Papas Fritas', '8.00', '0.00', 16, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (40, 'Porción de Yuca Frita', '8.00', '0.00', 16, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (41, 'Porción de Chifles', '6.00', '0.00', 16, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (42, 'Porción de Cancha Paccho', '4.00', '0.00', 16, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (43, 'Chicha Morada (Jarra 1L)', '15.00', '0.00', 2, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (44, 'Chicha Morada (Vaso)', '5.00', '0.00', 2, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (45, 'Maracuyá (Jarra 1L)', '15.00', '0.00', 2, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (46, 'Maracuyá (Vaso)', '5.00', '0.00', 2, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (47, 'Coca Cola 1.5L', '12.00', '0.00', 2, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (48, 'Inca Kola 1.5L', '12.00', '0.00', 2, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (49, 'Agua Mineral sin gas', '3.00', '0.00', 3, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (50, 'Agua Mineral con gas', '3.50', '0.00', 3, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (51, 'Cerveza Pilsen Callao 620ml', '10.00', '0.00', 4, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (52, 'Cerveza Cristal 620ml', '10.00', '0.00', 4, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (53, 'Cerveza Cusqueña Dorada 620ml', '12.00', '0.00', 4, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (54, 'Cerveza Corona 355ml', '8.00', '0.00', 4, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (55, 'Helado de Chocolate (2 Bolas)', '7.00', '0.00', 5, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (56, 'Helado de Fresa (2 Bolas)', '7.00', '0.00', 5, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (57, 'Helado de Lúcuma (2 Bolas)', '8.00', '0.00', 5, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (58, 'Crema Volteada', '8.00', '0.00', 6, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (59, 'Torta de Chocolate', '10.00', '0.00', 6, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (60, 'Alfajores (Porción)', '6.00', '0.00', 6, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (61, 'Cebiche Don Bigote Especial (Pesca del Día + Pulpo + Conchas)', '46.00', '0.00', 7, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (62, 'Tiradito Nikkei al Shoyu y Aceite de Ajonjolí', '38.00', '0.00', 8, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (63, 'Tiradito al Rocoto Ahumado', '34.00', '0.00', 8, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (64, 'Leche de Tigre Apaltada al Ají Amarillo', '22.00', '0.00', 9, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (65, 'Causa Acebichada Don Bigote', '28.00', '0.00', 10, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (66, 'Conchas a la Parmesana (Media Docena)', '32.00', '0.00', 10, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (67, 'Tequeños Rellenos de Mariscos (8 unidades)', '24.00', '0.00', 10, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (68, 'Chicharrón de Langostinos al Panko', '38.00', '0.00', 10, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (69, 'Jalea Real Don Bigote (Para 3-4 personas)', '75.00', '0.00', 11, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (70, 'Rissotto Marino al Ají Amarillo con Pulpo Grillado', '45.00', '0.00', 11, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (71, 'Filete de Pescado en Salsa de Mariscos', '36.00', '0.00', 11, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (72, 'Corvina Entera Frita con Patacones', '42.00', '0.00', 1, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (73, 'Arroz con Mariscos a la Chalaca Especial', '38.00', '0.00', 12, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (74, 'Arroz Chaufa Marino Don Bigote', '34.00', '0.00', 12, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (75, 'Tacu Tacu Criollo con Lomo al Jugo', '36.00', '0.00', 15, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (76, 'Parihuela Don Bigote con Cangrejo Entero', '45.00', '0.00', 13, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (77, 'Chilcano Especial con Dados de Pescado', '18.00', '0.00', 13, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (78, 'Sudado de Cabrilla al Vino Blanco', '39.00', '0.00', 14, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (79, 'Pisco Sour Clásico Don Bigote', '18.00', '0.00', 2, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (80, 'Maracuyá Sour', '19.00', '0.00', 2, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (81, 'Chilcano de Pisco Clásico', '16.00', '0.00', 2, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (82, 'Limonada de Hierbabuena Frozen (Jarra 1L)', '16.00', '0.00', 3, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (83, 'Suspiro a la Limeña Clásico', '12.00', '0.00', 6, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (84, 'Pie de Limón Don Bigote', '11.00', '0.00', 6, 'PREPARADO', NULL, 1);
INSERT INTO `productos` (`id`, `nombre`, `precio`, `costo_estimado`, `categoria_id`, `tipo_producto`, `insumo_directo_id`, `disponible`) VALUES (85, 'Combinado Limeño (Arroz con Leche + Mazamorra)', '9.00', '0.00', 6, 'PREPARADO', NULL, 1);

-- --------------------------------------------------------
-- Estructura de tabla: `recetas_detalles`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `recetas_detalles`;
CREATE TABLE `recetas_detalles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `producto_id` int NOT NULL,
  `insumo_id` int NOT NULL,
  `cantidad_requerida` decimal(12,4) NOT NULL,
  `es_critico` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_receta_producto_insumo` (`producto_id`,`insumo_id`),
  KEY `insumo_id` (`insumo_id`),
  CONSTRAINT `recetas_detalles_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `recetas_detalles_ibfk_2` FOREIGN KEY (`insumo_id`) REFERENCES `insumos` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=203 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Datos volcados para `recetas_detalles` (163 registros)
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (8, 2, 18, '0.2200', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (9, 2, 3, '0.0900', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (10, 2, 19, '0.0800', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (11, 2, 20, '0.1800', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (12, 2, 12, '0.1500', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (13, 8, 1, '0.2400', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (14, 8, 2, '0.1400', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (15, 8, 3, '0.0800', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (16, 8, 5, '1.0000', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (17, 11, 1, '0.1800', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (18, 11, 11, '0.1500', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (19, 11, 2, '0.1400', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (20, 11, 3, '0.0800', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (29, 10, 16, '12.0000', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (30, 10, 2, '0.1500', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (31, 10, 3, '0.0800', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (56, 61, 35, '3.0000', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (57, 66, 35, '6.0000', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (58, 66, 36, '0.1000', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (59, 65, 37, '0.1000', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (60, 79, 34, '0.0900', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (61, 79, 40, '0.0300', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (62, 80, 34, '0.0900', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (63, 80, 41, '0.0500', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (64, 1, 1, '0.2200', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (65, 1, 2, '0.1500', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (66, 1, 61, '0.1000', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (67, 1, 4, '0.0150', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (68, 1, 15, '0.0080', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (69, 1, 5, '0.1200', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (70, 1, 6, '0.0800', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (71, 1, 72, '0.0300', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (72, 12, 1, '0.2000', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (73, 12, 2, '0.1200', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (74, 12, 13, '0.0600', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (75, 12, 6, '0.0800', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (76, 12, 5, '0.1000', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (77, 13, 1, '0.2000', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (78, 13, 2, '0.1200', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (79, 13, 13, '0.0600', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (80, 13, 6, '0.0800', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (81, 13, 5, '0.1000', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (82, 14, 1, '0.2000', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (83, 14, 2, '0.1200', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (84, 14, 13, '0.0600', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (85, 14, 6, '0.0800', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (86, 14, 5, '0.1000', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (87, 15, 1, '0.0800', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (88, 15, 10, '0.0600', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (89, 15, 2, '0.1200', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (90, 15, 81, '0.1500', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (91, 15, 6, '0.0500', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (92, 15, 72, '0.0300', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (93, 16, 1, '0.0800', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (94, 16, 10, '0.0600', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (95, 16, 2, '0.1200', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (96, 16, 81, '0.1500', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (97, 16, 6, '0.0500', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (98, 16, 72, '0.0300', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (99, 20, 11, '0.2500', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (100, 20, 75, '0.0800', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (101, 20, 76, '0.0400', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (102, 20, 78, '0.1500', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (103, 20, 71, '0.1500', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (104, 21, 51, '0.2500', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (105, 21, 75, '0.0800', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (106, 21, 76, '0.0400', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (107, 21, 77, '1.0000', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (108, 21, 78, '0.1500', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (109, 21, 71, '0.1500', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (110, 24, 10, '0.2200', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (111, 24, 12, '0.2000', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (112, 24, 13, '0.0500', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (113, 24, 68, '0.0300', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (114, 24, 73, '0.0500', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (115, 24, 81, '0.1500', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (116, 25, 10, '0.2000', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (117, 25, 12, '0.2200', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (118, 25, 77, '1.0000', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (119, 25, 21, '0.0400', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (120, 25, 39, '0.0100', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (121, 25, 65, '0.0100', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (122, 26, 51, '0.2000', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (123, 26, 12, '0.2200', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (124, 26, 77, '1.0000', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (125, 26, 21, '0.0400', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (126, 26, 39, '0.0100', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (127, 29, 51, '0.1800', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (128, 29, 10, '0.1800', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (129, 29, 11, '0.1200', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (130, 29, 75, '0.1200', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (131, 29, 78, '0.2000', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (132, 29, 71, '0.2000', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (133, 29, 61, '0.0800', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (134, 30, 1, '0.1800', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (135, 30, 10, '0.2000', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (136, 30, 68, '0.0600', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (137, 30, 73, '0.0800', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (138, 30, 81, '0.3500', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (139, 32, 81, '0.4000', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (140, 32, 51, '0.1000', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (141, 32, 2, '0.0600', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (142, 32, 72, '0.0300', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (143, 32, 61, '0.0400', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (144, 33, 1, '0.2500', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (145, 33, 74, '0.1000', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (146, 33, 61, '0.1200', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (147, 33, 73, '0.0800', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (148, 33, 71, '0.1500', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (149, 34, 1, '0.2500', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (150, 34, 74, '0.1000', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (151, 34, 61, '0.1200', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (152, 34, 73, '0.0800', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (153, 34, 71, '0.1500', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (154, 62, 1, '0.2000', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (155, 62, 2, '0.1200', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (156, 62, 13, '0.0600', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (157, 62, 6, '0.0800', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (158, 62, 5, '0.1000', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (159, 63, 1, '0.2000', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (160, 63, 2, '0.1200', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (161, 63, 13, '0.0600', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (162, 63, 6, '0.0800', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (163, 63, 5, '0.1000', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (164, 64, 1, '0.0800', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (165, 64, 10, '0.0600', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (166, 64, 2, '0.1200', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (167, 64, 81, '0.1500', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (168, 64, 6, '0.0500', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (169, 64, 72, '0.0300', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (170, 69, 51, '0.1800', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (171, 69, 10, '0.1800', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (172, 69, 11, '0.1200', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (173, 69, 75, '0.1200', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (174, 69, 78, '0.2000', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (175, 69, 71, '0.2000', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (176, 69, 61, '0.0800', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (177, 73, 10, '0.2200', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (178, 73, 12, '0.2000', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (179, 73, 13, '0.0500', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (180, 73, 68, '0.0300', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (181, 73, 73, '0.0500', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (182, 73, 81, '0.1500', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (183, 76, 1, '0.1800', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (184, 76, 10, '0.2000', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (185, 76, 68, '0.0600', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (186, 76, 73, '0.0800', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (187, 76, 81, '0.3500', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (188, 77, 81, '0.4000', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (189, 77, 51, '0.1000', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (190, 77, 2, '0.0600', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (191, 77, 72, '0.0300', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (192, 77, 61, '0.0400', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (193, 78, 1, '0.2500', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (194, 78, 74, '0.1000', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (195, 78, 61, '0.1200', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (196, 78, 73, '0.0800', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (197, 78, 71, '0.1500', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (198, 81, 81, '0.4000', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (199, 81, 51, '0.1000', 1);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (200, 81, 2, '0.0600', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (201, 81, 72, '0.0300', 0);
INSERT INTO `recetas_detalles` (`id`, `producto_id`, `insumo_id`, `cantidad_requerida`, `es_critico`) VALUES (202, 81, 61, '0.0400', 0);

-- --------------------------------------------------------
-- Estructura de tabla: `turnos_caja`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `turnos_caja`;
CREATE TABLE `turnos_caja` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `nombre_turno` enum('Mañana','Tarde') NOT NULL,
  `fecha_apertura` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_cierre` timestamp NULL DEFAULT NULL,
  `monto_inicial` decimal(10,2) NOT NULL DEFAULT '0.00',
  `monto_final_esperado` decimal(10,2) DEFAULT NULL,
  `monto_final_real` decimal(10,2) DEFAULT NULL,
  `estado` enum('Abierto','Cerrado') NOT NULL DEFAULT 'Abierto',
  `observaciones` text,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `turnos_caja_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Estructura de tabla: `usuarios`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `usuario` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` varchar(20) DEFAULT 'mesero',
  `telefono` varchar(20) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `token_version` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario` (`usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Datos volcados para `usuarios` (5 registros)
INSERT INTO `usuarios` (`id`, `nombre`, `usuario`, `password`, `rol`, `telefono`, `activo`, `token_version`, `created_at`) VALUES (1, 'Administrador', 'admin', 'admin123', 'admin', NULL, 1, 1, '2026-09-29 20:29:47');
INSERT INTO `usuarios` (`id`, `nombre`, `usuario`, `password`, `rol`, `telefono`, `activo`, `token_version`, `created_at`) VALUES (2, 'Mesero 1', 'mesero1', '1234', 'mesero', NULL, 1, 1, '2026-09-29 20:29:47');
INSERT INTO `usuarios` (`id`, `nombre`, `usuario`, `password`, `rol`, `telefono`, `activo`, `token_version`, `created_at`) VALUES (3, 'arian', 'ariana', 'ariana123', 'mesero', NULL, 1, 1, '2026-10-05 00:05:53');
INSERT INTO `usuarios` (`id`, `nombre`, `usuario`, `password`, `rol`, `telefono`, `activo`, `token_version`, `created_at`) VALUES (4, 'cocinero', 'cocina', 'cocina123', 'cocina', NULL, 1, 1, '2026-10-05 00:06:11');
INSERT INTO `usuarios` (`id`, `nombre`, `usuario`, `password`, `rol`, `telefono`, `activo`, `token_version`, `created_at`) VALUES (5, 'CAJERO', 'cajero', 'cajero123', 'cajero', NULL, 1, 1, '2026-10-05 00:14:11');

SET FOREIGN_KEY_CHECKS=1;
