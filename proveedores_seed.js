// Catálogo oficial de 50 distribuidores y proveedores gastronómicos peruanos
// La Sazón de Don Bigote — Sistema Restaurante

const PROVEEDORES = [
  // 1-10: Pescados y Mariscos Frescos
  { ruc: '20512345671', razon_social: 'Pescados & Mariscos El Callao S.A.C.', nombre_comercial: 'Mariscos El Callao', categoria: 'Pescados y Mariscos', telefono: '987111222', direccion: 'Terminal Pesquero del Callao Puesto 14', contacto: 'Carlos Benítez' },
  { ruc: '20523456782', razon_social: 'Distribuidora Marina Chimbote S.A.C.', nombre_comercial: 'Marina Chimbote', categoria: 'Pescados y Mariscos', telefono: '987222333', direccion: 'Muelle Pesquero Chimbote / Villa María', contacto: 'Rosa Quispe' },
  { ruc: '20100156981', razon_social: 'Pesquera Diamante S.A.', nombre_comercial: 'Diamante Frescos', categoria: 'Pescados y Mariscos', telefono: '01-5132000', direccion: 'Av. República de Panamá 2461, San Isidro', contacto: 'Jorge Alarcón' },
  { ruc: '20601234563', razon_social: 'Mariscos y Congelados del Norte E.I.R.L.', nombre_comercial: 'Mar del Norte Paita', categoria: 'Pescados y Mariscos', telefono: '944555666', direccion: 'Zona Industrial Paita, Piura', contacto: 'Miguel Sullón' },
  { ruc: '20534567894', razon_social: 'Distribuidora Pesquera La Punta S.A.C.', nombre_comercial: 'Pesquera La Punta', categoria: 'Pescados y Mariscos', telefono: '998777888', direccion: 'Malecón Pardo 240, La Punta, Callao', contacto: 'Eduardo Paz' },
  { ruc: '20602345675', razon_social: 'Comercializadora Marina Ventanilla S.A.C.', nombre_comercial: 'Marina Ventanilla', categoria: 'Pescados y Mariscos', telefono: '981223344', direccion: 'Av. Néstor Gambetta Km 18, Ventanilla', contacto: 'Alberto Flores' },
  { ruc: '20545678906', razon_social: 'Langostinos & Mariscos Tumbes S.A.C.', nombre_comercial: 'Langostinos Tumbes', categoria: 'Pescados y Mariscos', telefono: '972334455', direccion: 'Carretera Panamericana Norte Km 1270, Tumbes', contacto: 'Fernando Silva' },
  { ruc: '20603456787', razon_social: 'Pulpos & Calamares del Sur S.R.L.', nombre_comercial: 'Calamares Pisco', categoria: 'Pescados y Mariscos', telefono: '956445566', direccion: 'Bahía de Paracas, Pisco, Ica', contacto: 'Víctor Morón' },
  { ruc: '20556789018', razon_social: 'Conchas Negras & Mariscos del Pacífico S.A.C.', nombre_comercial: 'Manglares del Pacífico', categoria: 'Pescados y Mariscos', telefono: '969556677', direccion: 'Puerto Pizarro, Tumbes', contacto: 'César Chiroque' },
  { ruc: '20604567899', razon_social: 'Mariscos Frescos Villa María del Triunfo E.I.R.L.', nombre_comercial: 'VMT Mariscos Mayorista', categoria: 'Pescados y Mariscos', telefono: '988667788', direccion: 'Av. Pachacútec 2200, VMT, Lima', contacto: 'Pedro Huamán' },

  // 11-16: Limones y Cítricos
  { ruc: '20567890120', razon_social: 'Distribuidora Cítricos Olmos S.A.C.', nombre_comercial: 'Limones Olmos', categoria: 'Limones y Cítricos', telefono: '974112233', direccion: 'Valle de Olmos, Lambayeque', contacto: 'Segundo Ramos' },
  { ruc: '20605678911', razon_social: 'Limones del Valle Chulucanas S.R.L.', nombre_comercial: 'Cítricos Chulucanas', categoria: 'Limones y Cítricos', telefono: '968223344', direccion: 'Campiña Chulucanas, Piura', contacto: 'Manuel Nizama' },
  { ruc: '20578901232', razon_social: 'Cítricos & Frutas Tambogrande S.A.C.', nombre_comercial: 'Limón Tambogrande Sutil', categoria: 'Limones y Cítricos', telefono: '952334455', direccion: 'Valle de San Lorenzo, Tambogrande, Piura', contacto: 'Héctor Coronado' },
  { ruc: '20606789023', razon_social: 'Agrocomercial Cítricos del Norte E.I.R.L.', nombre_comercial: 'Cítricos del Norte', categoria: 'Limones y Cítricos', telefono: '946445566', direccion: 'Av. Champagnat 510, Sullana', contacto: 'Javier Carrión' },
  { ruc: '20589012344', razon_social: 'Distribuidora Santa Anita Limones S.A.C.', nombre_comercial: 'Limón Mayorista Santa Anita', categoria: 'Limones y Cítricos', telefono: '981556677', direccion: 'Gran Mercado Mayorista de Lima Pabellón C', contacto: 'Walter Mendoza' },
  { ruc: '20607890135', razon_social: 'Agrícola San Fernando Frutas & Cítricos S.A.C.', nombre_comercial: 'Cítricos Huaral', categoria: 'Limones y Cítricos', telefono: '997667788', direccion: 'Valle Chancay-Huaral, Lima', contacto: 'Renzo Balcázar' },

  // 17-23: Verduras, Cebollas y Ajíes
  { ruc: '20590123456', razon_social: 'Hortalizas & Cebollas Arequipeñas S.A.C.', nombre_comercial: 'Cebolla Roja Majes', categoria: 'Verduras y Hortalizas', telefono: '958778899', direccion: 'El Pedregal, Majes, Arequipa', contacto: 'Edgar Zúñiga' },
  { ruc: '20608901247', razon_social: 'Distribuidora Mayorista Ajíes del Perú S.R.L.', nombre_comercial: 'Ají Amarillo & Limo Perú', categoria: 'Verduras y Hortalizas', telefono: '971889900', direccion: 'Valle Supe, Barranca, Lima', contacto: 'Julio Espinoza' },
  { ruc: '20609012358', razon_social: 'Comercializadora Tubérculos Andinos Huánuco S.A.C.', nombre_comercial: 'Papas & Camotes Huánuco', categoria: 'Verduras y Hortalizas', telefono: '962990011', direccion: 'Mercado Mayorista Puelles, Huánuco', contacto: 'Marcos Alania' },
  { ruc: '20610123469', razon_social: 'Hortalizas Frescas Pachacámac S.A.C.', nombre_comercial: 'Bio Huerto Pachacámac', categoria: 'Verduras y Hortalizas', telefono: '983112233', direccion: 'Valle Verde Lote 12, Pachacámac, Lima', contacto: 'Gloria Torres' },
  { ruc: '20611234570', razon_social: 'Distribuidora de Ajos y Cebollas Santa Anita E.I.R.L.', nombre_comercial: 'Ajo Barranquino Santa Anita', categoria: 'Verduras y Hortalizas', telefono: '994223344', direccion: 'Pabellón D Puesto 28, GMML, Santa Anita', contacto: 'Raúl Córdova' },
  { ruc: '20612345681', razon_social: 'Agroindustrias Choclo & Maíz Cusco S.R.L.', nombre_comercial: 'Choclo Urubamba Gigante', categoria: 'Verduras y Hortalizas', telefono: '984334455', direccion: 'Valle Sagrado de los Incas, Urubamba', contacto: 'Guillermo Tupayachi' },
  { ruc: '20613456792', razon_social: 'Verduras Seleccionadas del Valle Verde S.A.C.', nombre_comercial: 'Cilantro & Yuca Cañete', categoria: 'Verduras y Hortalizas', telefono: '975445566', direccion: 'San Vicente de Cañete, Lima', contacto: 'Dario Casas' },

  // 24-32: Abarrotes, Aceites y Arroces
  { ruc: '20100055237', razon_social: 'Alicorp S.A.A.', nombre_comercial: 'Alicorp Alimentos', categoria: 'Abarrotes y Aceites', telefono: '01-3150800', direccion: 'Av. Argentina 4793, Callao', contacto: 'Atención Restaurantes' },
  { ruc: '20100234871', razon_social: 'Compañía Molinera del Centro S.A.', nombre_comercial: 'Harinas Molinera del Centro', categoria: 'Abarrotes y Aceites', telefono: '01-3261100', direccion: 'Av. Nicolás Ayllón 2240, Ate Vitarte', contacto: 'Gonzalo Riva' },
  { ruc: '20387569123', razon_social: 'Agroindustrial Costeño Alimentos S.A.C.', nombre_comercial: 'Arroz Costeño', categoria: 'Abarrotes y Aceites', telefono: '01-6140000', direccion: 'Av. Los Faisanes 118, Chorrillos', contacto: 'Ventas HORECA' },
  { ruc: '20456123789', razon_social: 'Molinera Valle Norte S.A.C.', nombre_comercial: 'Arroz Valle Norte Extra', categoria: 'Abarrotes y Aceites', telefono: '01-7195000', direccion: 'Carretera Panamericana Norte Km 775, Chiclayo', contacto: 'Felipe Sandoval' },
  { ruc: '20492089471', razon_social: 'Distribuidora Abarrotes Makro Perú S.A.', nombre_comercial: 'Makro Supermayorista', categoria: 'Abarrotes y Aceites', telefono: '01-6117000', direccion: 'Av. Circunvalación 2121, Santiago de Surco', contacto: 'Canal Profesional' },
  { ruc: '20521489632', razon_social: 'Alimentos & Salsas Orientales Lee Kum Kee Perú S.A.C.', nombre_comercial: 'Sillao & Salsa de Ostión Perú', categoria: 'Abarrotes y Aceites', telefono: '989112233', direccion: 'Calle Paruro 820, Barrio Chino, Lima', contacto: 'Kenji Wong' },
  { ruc: '20100085063', razon_social: 'Ajinomoto del Perú S.A.', nombre_comercial: 'Ajinomoto Gastronomía', categoria: 'Abarrotes y Aceites', telefono: '01-6159600', direccion: 'Av. República de Panamá 2461, La Victoria', contacto: 'Área Food Service' },
  { ruc: '20536985214', razon_social: 'Especias & Condimentos El Sol E.I.R.L.', nombre_comercial: 'Condimentos El Sol', categoria: 'Abarrotes y Aceites', telefono: '998223344', direccion: 'Jr. Ayacucho 440, Cercado de Lima', contacto: 'Lucía Paredes' },
  { ruc: '20514785236', razon_social: 'Aceites & Grasas Vegetales Primor S.A.C.', nombre_comercial: 'Aceite Primor Gastronómico', categoria: 'Abarrotes y Aceites', telefono: '01-3150900', direccion: 'Av. Néstor Gambetta 150, Callao', contacto: 'Daniel Lazo' },

  // 33-39: Cervezas y Bebidas
  { ruc: '20100113610', razon_social: 'Unión de Cervecerías Peruanas Backus y Johnston S.A.A.', nombre_comercial: 'Backus (Cusqueña / Pilsen / Cristal)', categoria: 'Bebidas y Cervezas', telefono: '01-3113000', direccion: 'Av. Nicolás Ayllón 3986, Ate, Lima', contacto: 'Distribución Directa' },
  { ruc: '20511874298', razon_social: 'Compañía Embotelladora CBC del Perú S.A.C.', nombre_comercial: 'CBC (Pepsi / Concordia / San Carlos)', categoria: 'Bebidas y Cervezas', telefono: '01-6187700', direccion: 'Av. Faustino Sánchez Carrión 465, San Isidro', contacto: 'Ventas Lima Centro' },
  { ruc: '20101684784', razon_social: 'Arca Continental Lindley S.A.', nombre_comercial: 'Inca Kola & Coca-Cola Perú', categoria: 'Bebidas y Cervezas', telefono: '01-3116500', direccion: 'Av. Javier Prado Este 4200, Santiago de Surco', contacto: 'Canal Restaurantes' },
  { ruc: '20606678234', razon_social: 'Heineken del Perú S.A.C.', nombre_comercial: 'Heineken & Tres Cruces', categoria: 'Bebidas y Cervezas', telefono: '01-7102000', direccion: 'Av. Las Begonias 415, San Isidro, Lima', contacto: 'Martín Barrenechea' },
  { ruc: '20104598712', razon_social: 'Bodegas y Viñedos Tabernero S.A.C.', nombre_comercial: 'Pisco & Vinos Tabernero', categoria: 'Bebidas y Cervezas', telefono: '01-4442345', direccion: 'Av. 28 de Julio 500, Chincha Alta / Lima', contacto: 'Santiago Rotondo' },
  { ruc: '20100198421', razon_social: 'Distribuidora de Vinos y Piscos Santiago Queirolo S.A.C.', nombre_comercial: 'Piscos Santiago Queirolo', categoria: 'Bebidas y Cervezas', telefono: '01-4600441', direccion: 'Av. San Martín 1062, Pueblo Libre, Lima', contacto: 'Jorge Queirolo' },
  { ruc: '20547896321', razon_social: 'Aguas de Mesa San Mateo & San Luis Distribución S.R.L.', nombre_comercial: 'Agua Mineral Manantial', categoria: 'Bebidas y Cervezas', telefono: '997334455', direccion: 'Valle de Huarochirí Km 45, Lima', contacto: 'Patricia Loyola' },

  // 40-44: Lácteos y Huevos
  { ruc: '20100190797', razon_social: 'Leche Gloria S.A.', nombre_comercial: 'Gloria Alimentos & Lácteos', categoria: 'Lácteos y Huevos', telefono: '01-4707170', direccion: 'Av. República de Panamá 2461, La Victoria', contacto: 'Canal Institucional' },
  { ruc: '20100095450', razon_social: 'Laive S.A.', nombre_comercial: 'Laive Mantequillas & Quesos', categoria: 'Lácteos y Huevos', telefono: '01-6184000', direccion: 'Av. Nicolás Hermoza 110, Ate, Lima', contacto: 'Esteban Palacios' },
  { ruc: '20100154341', razon_social: 'San Fernando S.A.', nombre_comercial: 'San Fernando Huevos & Aves', categoria: 'Lácteos y Huevos', telefono: '01-2135300', direccion: 'Av. República de Panamá 4295, Surquillo', contacto: 'Ventas Mayoristas' },
  { ruc: '20101235478', razon_social: 'Granja Avícola La Calera S.A.C.', nombre_comercial: 'Huevos de Granja La Calera', categoria: 'Lácteos y Huevos', telefono: '01-6192000', direccion: 'Alto Larán, Chincha / Distribuidora Lima', contacto: 'Ignacio Tello' },
  { ruc: '20563214789', razon_social: 'Lácteos y Quesos Andinos de Cajamarca E.I.R.L.', nombre_comercial: 'Queso Mantecoso Cajamarca', categoria: 'Lácteos y Huevos', telefono: '976445566', direccion: 'Jr. Amazonas 740, Cajamarca', contacto: 'Hernán Cueva' },

  // 45-50: Envases Biodegradables y Descartables
  { ruc: '20268593412', razon_social: 'Distribuidora Pamolsa Envases del Perú S.A.', nombre_comercial: 'Pamolsa Envases', categoria: 'Envases y Descartables', telefono: '01-6140300', direccion: 'Av. Elmer Faucett 3448, Callao', contacto: 'Ventas Delivery' },
  { ruc: '20602587413', razon_social: 'Empaques Biodegradables Bionatur S.A.C.', nombre_comercial: 'Bionatur Envases Ecológicos', categoria: 'Envases y Descartables', telefono: '993556677', direccion: 'Jr. Huancavelica 1050, Cercado de Lima', contacto: 'Cecilia Montero' },
  { ruc: '20514896325', razon_social: 'Descartables y Bolsas San Jacinto S.R.L.', nombre_comercial: 'San Jacinto Plásticos & Papel', categoria: 'Envases y Descartables', telefono: '01-3245566', direccion: 'Av. Nicolás de Piérola 1420, Lima', contacto: 'Víctor Samamé' },
  { ruc: '20102589631', razon_social: 'Papelera Nacional Papelsa S.A.C.', nombre_comercial: 'Papelsa Servilletas & Toallas', categoria: 'Envases y Descartables', telefono: '01-4521234', direccion: 'Av. Materiales 2245, Cercado de Lima', contacto: 'Luis Miranda' },
  { ruc: '20536987412', razon_social: 'Termoformados & Vasos Plásticos del Sur S.A.C.', nombre_comercial: 'Vasos & Contenedores del Sur', categoria: 'Envases y Descartables', telefono: '01-5748899', direccion: 'Av. Industrial Lote 8, Lurín, Lima', contacto: 'Rubén Arriola' },
  { ruc: '20607412589', razon_social: 'EcoEnvases de Bagazo de Caña Perú S.A.C.', nombre_comercial: 'EcoBagazo Envases Ceviche', categoria: 'Envases y Descartables', telefono: '981667788', direccion: 'Av. Argentina 1840, Cercado de Lima', contacto: 'Diana Valdivia' }
];

module.exports = { PROVEEDORES };
