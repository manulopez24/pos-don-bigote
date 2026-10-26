const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'sistema_restaurante',
    multipleStatements: true
});

const sql = `
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'mesero',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    categoria_id INT,
    disponible BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

CREATE TABLE IF NOT EXISTS mesas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    estado VARCHAR(20) DEFAULT 'Libre'
);

CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_pedido VARCHAR(50) DEFAULT 'Mesa',
    mesa_id INT NULL,
    nombre_cliente VARCHAR(100),
    estado_global VARCHAR(20) DEFAULT 'Abierto',
    total DECIMAL(10,2) DEFAULT 0.00,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mesa_id) REFERENCES mesas(id)
);

CREATE TABLE IF NOT EXISTS detalles_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT,
    producto_id INT,
    cantidad INT NOT NULL,
    notas_cocina TEXT,
    estado_cocina VARCHAR(20) DEFAULT 'Pendiente',
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Insert admin user if not exists
INSERT IGNORE INTO usuarios (nombre, usuario, password, rol, activo) VALUES 
('Administrador', 'admin', 'admin123', 'admin', TRUE),
('Mesero 1', 'mesero1', '1234', 'mesero', TRUE);

-- Insert categories if not exists
INSERT IGNORE INTO categorias (id, nombre) VALUES 
(1, 'Platos Fuertes'),
(2, 'Bebidas'),
(3, 'Bebidas Frías'),
(4, 'Cervezas'),
(5, 'Helados'),
(6, 'Postres');

-- Insert some dummy products if not exists
INSERT IGNORE INTO productos (id, nombre, precio, categoria_id, disponible) VALUES 
(1, 'Ceviche Mixto', 25.00, 1, TRUE),
(2, 'Lomo Saltado', 22.00, 1, TRUE),
(3, 'Arroz con Pollo', 18.00, 1, TRUE),
(4, 'Inca Kola 1L', 8.00, 2, TRUE),
(5, 'Limonada Frozen', 6.00, 3, TRUE),
(6, 'Cusqueña Trigo', 9.00, 4, TRUE),
(7, 'Helado de Vainilla', 5.00, 5, TRUE);
`;

connection.query(sql, (err) => {
    if (err) {
        console.error('Error seeding database:', err);
    } else {
        console.log('Database seeded successfully (Tables and initial data created).');
    }
    connection.end();
});
