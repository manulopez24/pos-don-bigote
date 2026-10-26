const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234'
});
connection.query('CREATE DATABASE IF NOT EXISTS sistema_restaurante', (err) => {
    if (err) console.error(err);
    else console.log('Database created successfully.');
    connection.end();
});
