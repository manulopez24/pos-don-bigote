import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { socket } from './socket';

const API = ``;

const ROL_COLORS = {
  admin:  '#a855f7', cocina: '#f4a261',
  cajero: '#2dc653', mesero: '#00b4d8',
};

export default function AdminView({ user }) {
  const [tab,        setTab]        = useState('usuarios'); // 'usuarios' | 'platos' | 'insumos' | 'kardex' | 'consumo' | 'cambios' | 'ventas'
  const [usuarios,   setUsuarios]   = useState([]);
  const [productos,  setProductos]  = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [insumos,    setInsumos]    = useState([]);
  const [kardexList, setKardexList] = useState([]);
  const [loading,    setLoading]    = useState(true);

  // Modales de Usuarios
  const [showAddUserModal,  setShowAddUserModal]  = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [newUser,  setNewUser]  = useState({ nombre: '', usuario: '', password: '', rol: 'mesero' });
  const [editUser, setEditUser] = useState({ id: null, nombre: '', usuario: '', password: '', rol: 'mesero' });

  // Modales de Platos
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ nombre: '', precio: '', categoria_id: '' });
  const [editProduct, setEditProduct] = useState({ id: null, nombre: '', precio: '', categoria_id: '' });
  const [searchPlato, setSearchPlato] = useState('');

  // Modales de Insumos & Kardex
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [insumoAjuste, setInsumoAjuste] = useState({ id: null, nombre: '', stock_actual: 0, nuevo_stock: '', motivo: 'Ajuste físico de inventario', unidad: '' });
  const [showAddInsumoModal, setShowAddInsumoModal] = useState(false);
  const [newInsumo, setNewInsumo] = useState({ codigo: '', nombre: '', descripcion: '', unidad_medida: 'KG', stock_actual: '', stock_minimo: '', costo_unitario: '' });
  const [searchKardex, setSearchKardex] = useState('');
  const [filtroTipoKardex, setFiltroTipoKardex] = useState('TODOS'); // 'TODOS' | 'SALIDA_VENTA' | 'ENTRADA' | 'SALIDA_MERMA' | 'DEVOLUCION'

  // Reporte por Fecha (Ventas generales)
  const [fechaFiltro,      setFechaFiltro]      = useState(new Date().toISOString().split('T')[0]);
  const [reporteFechaData, setReporteFechaData] = useState({
    stats: { ventas_totales: 0, comprobantes_totales: 0, total_efectivo: 0, total_yape: 0, total_tarjeta: 0 },
    comprobantes: []
  });
  const [loadingReporte, setLoadingReporte] = useState(false);

  // Reporte de Consumo Total por Plato & Insumos Gastados
  const [consumoFecha, setConsumoFecha] = useState(new Date().toISOString().split('T')[0]);
  const [consumoData, setConsumoData] = useState({ platos: [], insumos_globales: [], total_unidades: 0, total_dinero: 0 });
  const [loadingConsumo, setLoadingConsumo] = useState(false);

  // Auditoría de Cambios de Plato & Modal de Autorización
  const [cambiosAuditoria, setCambiosAuditoria] = useState([]);
  const [loadingCambios, setLoadingCambios] = useState(false);
  const [showCambioPlatoModal, setShowCambioPlatoModal] = useState(false);
  const [pedidosAbiertos, setPedidosAbiertos] = useState([]);
  const [cambioData, setCambioData] = useState({ pedido_id: '', detalle_id: '', nuevo_producto_id: '', motivo: '', itemObj: null, modo: 'CAMBIAR' });
  const [submittingCambio, setSubmittingCambio] = useState(false);

  // Previsualización de Ticket para Admin
  const [ticketAdmin, setTicketAdmin] = useState(null);

  // Mejora 4: Compras a Proveedores (Ingreso de Mercadería)
  const [compras, setCompras] = useState([]);
  const [loadingCompras, setLoadingCompras] = useState(false);
  const [showAddCompraModal, setShowAddCompraModal] = useState(false);
  const [compraForm, setCompraForm] = useState({
    proveedor_nombre: '',
    proveedor_ruc: '',
    tipo_comprobante: 'Factura',
    serie_correlativo: '',
    fecha_compra: new Date().toISOString().split('T')[0],
    observaciones: '',
    items: []
  });
  const [submittingCompra, setSubmittingCompra] = useState(false);
  const [compraDetalleModal, setCompraDetalleModal] = useState(null);

  // Mejora 5: Copias de Seguridad (Backups)
  const [backups, setBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  // Catálogo de 50 Proveedores Oficiales & Estado de Jornada
  const [proveedoresList, setProveedoresList] = useState([]);
  const [estadoJornada, setEstadoJornada] = useState({ ventas_bloqueadas: false, medio_dia_cerrado: false });

  const generarSerieCorrelativo = (tipo = 'Factura') => {
    const prefijo = tipo === 'Factura' ? 'F001' : tipo === 'Boleta' ? 'B001' : tipo === 'Guía Remisión' ? 'T001' : 'TK01';
    const num = String(Math.floor(100000 + Math.random() * 900000));
    return `${prefijo}-${num}`;
  };

  const cargarProveedoresBD = useCallback(() => {
    axios.get(`${API}/api/admin/proveedores`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(({ data }) => setProveedoresList(data || []))
      .catch(err => console.error('Error cargando proveedores:', err));
  }, [user.token]);

  const cargarEstadoJornada = useCallback(() => {
    axios.get(`${API}/api/caja/estado-jornada`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(({ data }) => setEstadoJornada(data))
      .catch(err => console.error('Error cargando jornada:', err));
  }, [user.token]);

  const reactivarVentasAdmin = async () => {
    if (!window.confirm('¿Deseas reactivar las ventas y aperturar una nueva jornada de restaurante?')) return;
    try {
      const { data } = await axios.post(`${API}/api/admin/jornada/reactivar`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert(data.message || '✅ Ventas reactivadas exitosamente.');
      cargarEstadoJornada();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al reactivar ventas.');
    }
  };

  // Cargar usuarios, platos, insumos y categorías
  const cargarDatos = useCallback(() => {
    setLoading(true);
    const headers = { headers: { Authorization: `Bearer ${user.token}` } };
    Promise.all([
      axios.get(`${API}/api/admin/usuarios`, headers),
      axios.get(`${API}/api/admin/productos`, headers),
      axios.get(`${API}/api/admin/categorias`, headers),
      axios.get(`${API}/api/admin/insumos`, headers),
      axios.get(`${API}/api/admin/kardex`, headers)
    ])
      .then(([resU, resP, resC, resI, resK]) => {
        setUsuarios(resU.data);
        setProductos(resP.data);
        setCategorias(resC.data);
        setInsumos(resI.data);
        setKardexList(resK.data);
        if (resC.data.length > 0 && !newProduct.categoria_id) {
          setNewProduct(prev => ({ ...prev, categoria_id: resC.data[0].id }));
        }
      })
      .catch(err => console.error('Error cargando datos admin:', err))
      .finally(() => setLoading(false));
  }, [user.token]);

  // Cargar ventas por fecha seleccionada
  const cargarVentasPorFecha = useCallback((fecha) => {
    setLoadingReporte(true);
    axios.get(`${API}/api/admin/ventas-por-fecha?fecha=${fecha}`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(({ data }) => setReporteFechaData(data))
      .catch(err => console.error('Error cargando reporte por fecha:', err))
      .finally(() => setLoadingReporte(false));
  }, [user.token]);

  // Cargar Consumo Total por Plato & Insumos Gastados
  const cargarConsumoPlatos = useCallback((fecha) => {
    setLoadingConsumo(true);
    axios.get(`${API}/api/admin/consumo-platos?fecha=${fecha}`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(({ data }) => setConsumoData(data))
      .catch(err => console.error('Error cargando consumo por plato:', err))
      .finally(() => setLoadingConsumo(false));
  }, [user.token]);

  // Cargar Historial de Auditoría de Cambios de Plato
  const cargarCambiosPlatos = useCallback(() => {
    setLoadingCambios(true);
    axios.get(`${API}/api/admin/cambios-platos`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(({ data }) => setCambiosAuditoria(data))
      .catch(err => console.error('Error cargando auditoría de cambios:', err))
      .finally(() => setLoadingCambios(false));
  }, [user.token]);

  // Abrir Modal de Cambio de Plato desde Admin
  const abrirModalCambioAdmin = async () => {
    try {
      const { data } = await axios.get(`${API}/api/caja/pedidos`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setPedidosAbiertos(data);
      const primero = data[0];
      const primerItem = primero?.items?.[0] || null;
      setCambioData({
        pedido_id: primero?.pedido_id || '',
        detalle_id: primerItem?.detalle_id || '',
        nuevo_producto_id: '',
        motivo: '',
        itemObj: primerItem,
        modo: 'CAMBIAR'
      });
      setShowCambioPlatoModal(true);
    } catch (err) {
      alert('Error cargando pedidos abiertos.');
    }
  };

  const handleEjecutarCambioAdmin = async () => {
    if (!cambioData.pedido_id || !cambioData.detalle_id) {
      alert('⚠️ Selecciona mesa y plato.');
      return;
    }
    if (cambioData.modo !== 'CANCELAR' && !cambioData.nuevo_producto_id) {
      alert('⚠️ Selecciona el nuevo plato deseado.');
      return;
    }
    if (!cambioData.motivo || cambioData.motivo.trim().length < 4) {
      alert('⚠️ Ingresa un motivo válido para la auditoría (mínimo 4 caracteres).');
      return;
    }
    setSubmittingCambio(true);
    try {
      if (cambioData.modo === 'CANCELAR') {
        const { data } = await axios.post(`${API}/api/admin/cancelar-plato-detalle`, {
          pedido_id: cambioData.pedido_id,
          detalle_id: cambioData.detalle_id,
          motivo: cambioData.motivo.trim()
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        alert(`✅ ${data.message}`);
      } else {
        const { data } = await axios.post(`${API}/api/admin/cambiar-plato`, {
          pedido_id: cambioData.pedido_id,
          detalle_id: cambioData.detalle_id,
          nuevo_producto_id: cambioData.nuevo_producto_id,
          motivo: cambioData.motivo.trim()
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        alert(`✅ ${data.message}\n${data.fue_merma ? '⚠️ Se declaró como merma en cocina (plato en preparación).' : '📦 Insumos devueltos a almacén y Kardex (plato pendiente).'}`);
      }
      setShowCambioPlatoModal(false);
      cargarDatos();
      cargarCambiosPlatos();
    } catch (err) {
      alert(err.response?.data?.error || 'Error ejecutando operación de plato.');
    } finally {
      setSubmittingCambio(false);
    }
  };

  // Cargar compras a proveedores
  const cargarComprasBD = useCallback(() => {
    setLoadingCompras(true);
    axios.get(`${API}/api/admin/compras`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(({ data }) => setCompras(data || []))
      .catch(err => console.error('Error cargando compras:', err))
      .finally(() => setLoadingCompras(false));
  }, [user.token]);

  // Cargar lista de backups de base de datos
  const cargarBackupsBD = useCallback(() => {
    setLoadingBackups(true);
    axios.get(`${API}/api/admin/backups`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(({ data }) => setBackups(data || []))
      .catch(err => console.error('Error cargando backups:', err))
      .finally(() => setLoadingBackups(false));
  }, [user.token]);

  // Generar backup manual instantáneo
  const handleGenerarBackup = async () => {
    setGeneratingBackup(true);
    try {
      const { data } = await axios.post(`${API}/api/admin/backup`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert(`✅ ${data.message}\nArchivo guardado en el servidor: ${data.filename}`);
      cargarBackupsBD();
    } catch (err) {
      alert(err.response?.data?.error || 'Error generando copia de seguridad.');
    } finally {
      setGeneratingBackup(false);
    }
  };

  // Registrar nueva compra a proveedor
  const handleCrearCompra = async (e) => {
    e.preventDefault();
    if (!compraForm.proveedor_nombre.trim()) {
      alert('⚠️ Ingresa la Razón Social / Nombre del Proveedor.');
      return;
    }
    if (!compraForm.items || compraForm.items.length === 0) {
      alert('⚠️ Agrega al menos un insumo comprado.');
      return;
    }
    for (const it of compraForm.items) {
      if (!it.insumo_id || Number(it.cantidad) <= 0 || Number(it.costo_unitario) <= 0) {
        alert('⚠️ Verifica que cada fila tenga insumo seleccionado, cantidad > 0 y costo > 0.');
        return;
      }
    }

    setSubmittingCompra(true);
    try {
      const { data } = await axios.post(`${API}/api/admin/compras`, compraForm, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert(`✅ ${data.message}`);
      setShowAddCompraModal(false);
      setCompraForm({
        proveedor_nombre: '',
        proveedor_ruc: '',
        tipo_comprobante: 'Factura',
        serie_correlativo: '',
        fecha_compra: new Date().toISOString().split('T')[0],
        observaciones: '',
        items: []
      });
      cargarComprasBD();
      cargarDatos(); // Actualiza insumos y kardex
    } catch (err) {
      alert(err.response?.data?.error || 'Error registrando compra.');
    } finally {
      setSubmittingCompra(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    cargarProveedoresBD();
    cargarEstadoJornada();

    if (!socket.connected) socket.connect();
    socket.emit('unirse_sala', { rol: 'admin', usuario_id: user?.id });

    const handleStockActualizado = (data) => {
      if (data?.insumo_id && data?.stock_nuevo !== undefined) {
        setInsumos(prev => prev.map(i => i.id === data.insumo_id ? { ...i, stock_actual: data.stock_nuevo } : i));
      } else {
        axios.get(`${API}/api/admin/insumos`, { headers: { Authorization: `Bearer ${user.token}` } })
          .then(res => setInsumos(res.data));
      }
      axios.get(`${API}/api/admin/kardex`, { headers: { Authorization: `Bearer ${user.token}` } })
        .then(res => setKardexList(res.data));
    };

    const handleJornadaSync = () => cargarEstadoJornada();

    socket.on('STOCK_ACTUALIZADO', handleStockActualizado);
    socket.on('ESTADO_JORNADA_ACTUALIZADO', handleJornadaSync);
    socket.on('VENTAS_BLOQUEADAS', handleJornadaSync);
    socket.on('VENTAS_REACTIVADAS', handleJornadaSync);

    return () => {
      socket.off('STOCK_ACTUALIZADO', handleStockActualizado);
      socket.off('ESTADO_JORNADA_ACTUALIZADO', handleJornadaSync);
      socket.off('VENTAS_BLOQUEADAS', handleJornadaSync);
      socket.off('VENTAS_REACTIVADAS', handleJornadaSync);
    };
  }, [cargarDatos, cargarProveedoresBD, cargarEstadoJornada, user?.id, user.token]);

  useEffect(() => {
    if (tab === 'ventas') {
      cargarVentasPorFecha(fechaFiltro);
    } else if (tab === 'consumo') {
      cargarConsumoPlatos(consumoFecha);
    } else if (tab === 'cambios') {
      cargarCambiosPlatos();
    } else if (tab === 'compras') {
      cargarComprasBD();
    } else if (tab === 'backups') {
      cargarBackupsBD();
    }
  }, [tab, fechaFiltro, consumoFecha, cargarVentasPorFecha, cargarConsumoPlatos, cargarCambiosPlatos, cargarComprasBD, cargarBackupsBD]);

  // ── ELIMINAR / ANULAR BOLETA (SOLO ADMIN) ────────────────────
  const handleEliminarBoleta = async (id, correlativo) => {
    if (!window.confirm(`¿Seguro que deseas ELIMINAR / ANULAR la boleta ${correlativo}? Esta acción no se puede deshacer.`)) return;
    try {
      await axios.delete(`${API}/api/admin/comprobantes/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert(`✅ Boleta ${correlativo} eliminada de MySQL`);
      cargarVentasPorFecha(fechaFiltro);
    } catch (err) {
      alert('Error al eliminar la boleta.');
    }
  };

  // ── GESTIÓN DE USUARIOS ─────────────────────────────────────
  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    if (!newUser.nombre || !newUser.usuario || !newUser.password) {
      alert('Completa todos los campos obligatorios.');
      return;
    }
    try {
      await axios.post(`${API}/api/admin/usuarios`, newUser, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert('✅ Usuario registrado con éxito');
      setShowAddUserModal(false);
      setNewUser({ nombre: '', usuario: '', password: '', rol: 'mesero' });
      cargarDatos();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al crear usuario.');
    }
  };

  const abrirModalEditarUsuario = (u) => {
    setEditUser({ id: u.id, nombre: u.nombre, usuario: u.usuario, password: '', rol: u.rol });
    setShowEditUserModal(true);
  };

  const handleEditarUsuario = async (e) => {
    e.preventDefault();
    if (!editUser.nombre || !editUser.usuario) {
      alert('Nombre y usuario son requeridos.');
      return;
    }
    try {
      await axios.put(`${API}/api/admin/usuarios/${editUser.id}`, editUser, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert('✅ Usuario y contraseña actualizados en MySQL');
      setShowEditUserModal(false);
      cargarDatos();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al actualizar usuario.');
    }
  };

  const toggleUsuarioEstado = async (id, estadoActual) => {
    try {
      await axios.put(`${API}/api/admin/usuarios/${id}/estado`, { activo: !estadoActual }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      cargarDatos();
    } catch (err) {
      alert('Error al cambiar estado');
    }
  };

  const eliminarUsuario = async (id, nombre) => {
    if (!window.confirm(`¿Seguro que deseas eliminar al usuario "${nombre}"?`)) return;
    try {
      await axios.delete(`${API}/api/admin/usuarios/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      cargarDatos();
    } catch (err) {
      alert('Error al eliminar usuario');
    }
  };

  // ── GESTIÓN DE PLATOS ───────────────────────────────────────
  const handleCrearPlato = async (e) => {
    e.preventDefault();
    if (!newProduct.nombre || !newProduct.precio || !newProduct.categoria_id) {
      alert('Completa el nombre, precio y categoría.');
      return;
    }
    try {
      await axios.post(`${API}/api/admin/productos`, newProduct, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert('✅ Plato agregado al menú de MySQL');
      setShowAddProductModal(false);
      setNewProduct({ nombre: '', precio: '', categoria_id: categorias[0]?.id || '' });
      cargarDatos();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al agregar plato.');
    }
  };

  const togglePlatoDisponibilidad = async (id, disponibleActual) => {
    try {
      await axios.put(`${API}/api/admin/productos/${id}/estado`, { disponible: !disponibleActual }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      cargarDatos();
    } catch (err) {
      alert('Error al cambiar disponibilidad del plato');
    }
  };

  const abrirModalEditarPlato = (p) => {
    setEditProduct({
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      categoria_id: p.categoria_id || categorias.find(c => c.nombre === p.categoria)?.id || categorias[0]?.id || ''
    });
    setShowEditProductModal(true);
  };

  const handleEditarPlato = async (e) => {
    e.preventDefault();
    if (!editProduct.nombre || !editProduct.precio || !editProduct.categoria_id) {
      alert('Completa nombre, precio y categoría.');
      return;
    }
    try {
      await axios.put(`${API}/api/admin/productos/${editProduct.id}`, {
        nombre: editProduct.nombre,
        precio: parseFloat(editProduct.precio),
        categoria_id: editProduct.categoria_id
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert('✅ Plato y precio actualizados exitosamente');
      setShowEditProductModal(false);
      cargarDatos();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Error al actualizar el plato.';
      alert(`⚠️ ${msg}`);
    }
  };

  const eliminarPlato = async (id, nombre) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el plato "${nombre}" de la base de datos?`)) return;
    try {
      await axios.delete(`${API}/api/admin/productos/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      cargarDatos();
    } catch (err) {
      alert('Error al eliminar el plato.');
    }
  };

  // ── GESTIÓN DE INSUMOS & KARDEX ─────────────────────────────
  const handleCrearInsumo = async (e) => {
    e.preventDefault();
    if (!newInsumo.codigo || !newInsumo.nombre || !newInsumo.unidad_medida) {
      alert('Código, nombre y unidad de medida son requeridos.');
      return;
    }
    try {
      await axios.post(`${API}/api/admin/insumos`, newInsumo, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert('✅ Insumo y saldo inicial registrados en Kardex');
      setShowAddInsumoModal(false);
      setNewInsumo({ codigo: '', nombre: '', descripcion: '', unidad_medida: 'KG', stock_actual: '', stock_minimo: '', costo_unitario: '' });
      cargarDatos();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al crear insumo.');
    }
  };

  const abrirModalAjuste = (ins) => {
    setInsumoAjuste({
      id: ins.id,
      nombre: ins.nombre,
      stock_actual: Number(ins.stock_actual),
      tipo_operacion: 'AGREGAR', // 'AGREGAR' | 'MERMA' | 'AJUSTE_NEGATIVO'
      cantidad: '',
      motivo_detalle: 'Compra / Ingreso de insumo',
      unidad: ins.unidad_medida
    });
    setShowAjusteModal(true);
  };

  const handleAjustarStock = async (e) => {
    e.preventDefault();
    const cant = parseFloat(insumoAjuste.cantidad);
    if (isNaN(cant) || cant <= 0) {
      alert('Ingresa una cantidad mayor a cero.');
      return;
    }
    if ((insumoAjuste.tipo_operacion === 'MERMA' || insumoAjuste.tipo_operacion === 'AJUSTE_NEGATIVO') && cant > insumoAjuste.stock_actual) {
      alert(`No puedes descontar ${cant} ${insumoAjuste.unidad}. Stock actual disponible: ${insumoAjuste.stock_actual} ${insumoAjuste.unidad}.`);
      return;
    }
    try {
      const { data } = await axios.put(`${API}/api/admin/insumos/${insumoAjuste.id}/ajustar`, {
        tipo_operacion: insumoAjuste.tipo_operacion,
        cantidad: cant,
        motivo_detalle: insumoAjuste.motivo_detalle
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      // Actualización reactiva instantánea para evitar lag y sincronizar entre múltiples administradores concurrentes
      setInsumos(prev => prev.map(i => i.id === insumoAjuste.id ? { ...i, stock_actual: data.stock_nuevo } : i));
      setShowAjusteModal(false);
      // Sincronizar Kardex en segundo plano de manera silenciosa sin congelar la pantalla
      axios.get(`${API}/api/admin/kardex`, { headers: { Authorization: `Bearer ${user.token}` } })
        .then(res => setKardexList(res.data))
        .catch(err => console.error('Error sincronizando kardex:', err));
      alert(`✅ ${data.message}\nStock actualizado a: ${data.stock_nuevo} ${insumoAjuste.unidad}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al asentar movimiento en Kardex.';
      alert(`⚠️ ${msg}`);
    }
  };

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(searchPlato.toLowerCase()) ||
    p.categoria.toLowerCase().includes(searchPlato.toLowerCase())
  );

  const { stats, comprobantes } = reporteFechaData;

  return (
    <div className="admin-view">
      {/* Encabezado */}
      <div className="view-header admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div className="view-header__left">
          <h2 className="view-title">⚙️ Panel de Administración General — Don Bigote</h2>
          <p className="view-subtitle">Administrador responsable: {user.nombre}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {estadoJornada.medio_dia_cerrado && !estadoJornada.ventas_bloqueadas && (
            <span style={{ background: '#fef3c7', color: '#92400e', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, border: '1px solid #fde68a' }}>
              ⛅ Medio Día Cerrado
            </span>
          )}
          {estadoJornada.ventas_bloqueadas ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, border: '1px solid #fca5a5' }}>
                ⛔ Jornada Finalizada (Ventas Bloqueadas)
              </span>
              <button
                className="btn-send"
                style={{ background: '#16a34a', width: 'auto', padding: '7px 16px', fontSize: 13, fontWeight: 700 }}
                onClick={reactivarVentasAdmin}
              >
                🔓 Reactivar Ventas / Abrir Jornada
              </button>
            </div>
          ) : (
            <span style={{ background: '#dcfce7', color: '#15803d', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, border: '1px solid #86efac' }}>
              🟢 Ventas Habilitadas
            </span>
          )}
        </div>
      </div>

      {/* Pestañas de Navegación */}
      <div className="filter-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <button className={`filter-tab ${tab === 'usuarios' ? 'active' : ''}`} onClick={() => setTab('usuarios')}>
          👥 Personal ({usuarios.length})
        </button>
        <button className={`filter-tab ${tab === 'platos' ? 'active' : ''}`} onClick={() => setTab('platos')}>
          🍽️ Menú ({productos.length})
        </button>
        <button className={`filter-tab ${tab === 'insumos' ? 'active' : ''}`} onClick={() => setTab('insumos')}>
          📦 Stock & Insumos ({insumos.length})
        </button>
        <button className={`filter-tab ${tab === 'compras' ? 'active' : ''}`} onClick={() => { setTab('compras'); cargarComprasBD(); }}>
          🛒 Compras a Proveedores ({compras.length})
        </button>
        <button className={`filter-tab ${tab === 'kardex' ? 'active' : ''}`} onClick={() => setTab('kardex')}>
          📖 Kardex (Libro Mayor)
        </button>
        <button className={`filter-tab ${tab === 'consumo' ? 'active' : ''}`} onClick={() => setTab('consumo')}>
          📊 Consumo por Plato
        </button>
        <button className={`filter-tab ${tab === 'cambios' ? 'active' : ''}`} onClick={() => setTab('cambios')}>
          🔄 Cambios de Plato & Auditoría
        </button>
        <button className={`filter-tab ${tab === 'ventas' ? 'active' : ''}`} onClick={() => setTab('ventas')}>
          📅 Reporte de Ventas por Fecha
        </button>
        <button className={`filter-tab ${tab === 'backups' ? 'active' : ''}`} onClick={() => { setTab('backups'); cargarBackupsBD(); }}>
          💾 Copias de Seguridad ({backups.length})
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════
         1. GESTIÓN DE MESEROS Y PERSONAL
         ═══════════════════════════════════════════════════════════ */}
      {tab === 'usuarios' && (
        <div className="admin-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <h3>Lista de Usuarios Registrados en MySQL</h3>
            <button className="btn-send" style={{ width: 'auto', padding: '8px 18px', fontSize: 13 }} onClick={() => setShowAddUserModal(true)}>
              ➕ Registrar Nuevo Mesero / Usuario
            </button>
          </div>

          <div className="users-table-wrap">
            {loading ? <p style={{ padding: 20 }}>Cargando usuarios de MySQL...</p> : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre Completo</th>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id} className={!u.activo ? 'row-inactive' : ''}>
                      <td>#{u.id}</td>
                      <td className="td-name">{u.nombre}</td>
                      <td><code>{u.usuario}</code></td>
                      <td>
                        <span className="role-badge"
                          style={{ background: ROL_COLORS[u.rol] + '22', color: ROL_COLORS[u.rol], border: `1px solid ${ROL_COLORS[u.rol]}55` }}>
                          {u.rol}
                        </span>
                      </td>
                      <td>
                        <span className={`status-dot ${u.activo ? 'active' : 'inactive'}`}>
                          {u.activo ? '● Activo' : '● Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn-send"
                            style={{ padding: '3px 10px', fontSize: 11, background: '#0284c7' }}
                            onClick={() => abrirModalEditarUsuario(u)}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            className="btn-clear"
                            style={{ padding: '3px 8px', fontSize: 11 }}
                            onClick={() => toggleUsuarioEstado(u.id, u.activo)}
                          >
                            {u.activo ? '🚫 Desactivar' : '✅ Activar'}
                          </button>
                          {u.rol !== 'admin' && (
                            <button
                              className="qty-btn minus"
                              style={{ width: 'auto', height: 26, padding: '0 8px', fontSize: 11 }}
                              onClick={() => eliminarUsuario(u.id, u.nombre)}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
         2. GESTIÓN DEL MENÚ Y PLATOS
         ═══════════════════════════════════════════════════════════ */}
      {tab === 'platos' && (
        <div className="admin-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div className="pos-search-wrap" style={{ width: 280 }}>
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="pos-search-input"
                placeholder="Buscar plato en el menú..."
                value={searchPlato}
                onChange={(e) => setSearchPlato(e.target.value)}
              />
            </div>
            <button className="btn-send" style={{ width: 'auto', padding: '8px 18px', fontSize: 13 }} onClick={() => setShowAddProductModal(true)}>
              ➕ Agregar Nuevo Plato al Menú
            </button>
          </div>

          <div className="users-table-wrap">
            {loading ? <p style={{ padding: 20 }}>Cargando menú de MySQL...</p> : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre del Plato</th>
                    <th>Categoría</th>
                    <th>Precio (S/)</th>
                    <th>Disponibilidad</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map((p) => (
                    <tr key={p.id} className={!p.disponible ? 'row-inactive' : ''}>
                      <td>#{p.id}</td>
                      <td className="td-name">{p.nombre}</td>
                      <td><span className="role-badge" style={{ background: '#f1f5f9', color: '#475569' }}>{p.categoria}</span></td>
                      <td style={{ fontWeight: 800, color: 'var(--cyan-500)' }}>S/ {parseFloat(p.precio).toFixed(2)}</td>
                      <td>
                        <span className={`status-dot ${p.disponible ? 'active' : 'inactive'}`}>
                          {p.disponible ? '● Disponible' : '● Agotado'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn-clear"
                            style={{ padding: '3px 8px', fontSize: 11 }}
                            onClick={() => togglePlatoDisponibilidad(p.id, p.disponible)}
                          >
                            {p.disponible ? '🚫 Marcar Agotado' : '✅ Marcar Disponible'}
                          </button>
                          <button
                            className="btn-send"
                            style={{ width: 'auto', height: 26, padding: '0 8px', fontSize: 11, background: '#0284c7' }}
                            onClick={() => abrirModalEditarPlato(p)}
                            title="Editar precio y datos del plato"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            className="qty-btn minus"
                            style={{ width: 'auto', height: 26, padding: '0 8px', fontSize: 11 }}
                            onClick={() => eliminarPlato(p.id, p.nombre)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
         3. REPORTE DE VENTAS & BOLETAS POR FECHA (CON BOTÓN ELIMINAR BOLETA)
         ═══════════════════════════════════════════════════════════ */}
      {tab === 'ventas' && (
        <div className="admin-content">
          {/* Selector de Fecha */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)', padding: '12px 18px', borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
            <label style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy-900)' }}>📅 Seleccionar Fecha de Reporte:</label>
            <input
              type="date"
              className="modal-input"
              style={{ width: 180, fontWeight: 700 }}
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
            />
            <button className="btn-send" style={{ width: 'auto', padding: '8px 16px', fontSize: 13 }} onClick={() => cargarVentasPorFecha(fechaFiltro)}>
              🔄 Buscar Ventas
            </button>
          </div>

          {/* Tarjetas de Resumen para la fecha seleccionada */}
          <div className="admin-kpis">
            <div className="kpi-card kpi--cyan">
              <span className="kpi-icon">💵</span>
              <div>
                <div className="kpi-val">S/ {parseFloat(stats.ventas_totales || 0).toFixed(2)}</div>
                <div className="kpi-label">Ventas cobradas el {fechaFiltro}</div>
              </div>
            </div>
            <div className="kpi-card kpi--navy">
              <span className="kpi-icon">🧾</span>
              <div>
                <div className="kpi-val">{stats.comprobantes_totales || 0}</div>
                <div className="kpi-label">Boletas emitidas</div>
              </div>
            </div>
            <div className="kpi-card kpi--green">
              <span className="kpi-icon">💵</span>
              <div>
                <div className="kpi-val">S/ {parseFloat(stats.total_efectivo || 0).toFixed(2)}</div>
                <div className="kpi-label">Efectivo</div>
              </div>
            </div>
            <div className="kpi-card kpi--gold">
              <span className="kpi-icon">📱</span>
              <div>
                <div className="kpi-val">S/ {parseFloat(stats.total_yape || 0).toFixed(2)}</div>
                <div className="kpi-label">Yape / Plin</div>
              </div>
            </div>
          </div>

          {/* Lista de Boletas Emitidas en esa Fecha */}
          <div style={{ marginTop: 10 }}>
            <h3>📜 Boletas Registradas el {fechaFiltro} ({comprobantes.length})</h3>
            <div className="users-table-wrap" style={{ marginTop: 10 }}>
              {loadingReporte ? (
                <p style={{ padding: 20 }}>Buscando boletas de MySQL...</p>
              ) : comprobantes.length === 0 ? (
                <p style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se registraron boletas ni ventas en la fecha {fechaFiltro}.
                </p>
              ) : (
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>N° Comprobante</th>
                      <th>Tipo</th>
                      <th>Cliente</th>
                      <th>Mesero / Mesa</th>
                      <th>Método Pago</th>
                      <th>Hora</th>
                      <th>Total</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comprobantes.map((h) => (
                      <tr key={h.id}>
                        <td style={{ fontWeight: 800, color: 'var(--navy-900)' }}>{h.serie_correlativo}</td>
                        <td>
                          <span className="role-badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                            {h.tipo_comprobante}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{h.nombre_cliente}</div>
                          {h.doc_cliente && <small style={{ color: 'var(--text-muted)' }}>Doc: {h.doc_cliente}</small>}
                        </td>
                        <td>{h.mesero} ({h.mesa})</td>
                        <td>
                          <span className="role-badge" style={{
                            background: h.metodo_pago === 'Efectivo' ? '#dcfce7' : h.metodo_pago === 'Yape' ? '#fef3c7' : '#f3e8ff',
                            color: h.metodo_pago === 'Efectivo' ? '#15803d' : h.metodo_pago === 'Yape' ? '#b45309' : '#6b21a8'
                          }}>
                            {h.metodo_pago === 'Efectivo' ? '💵' : h.metodo_pago === 'Yape' ? '📱' : '💳'} {h.metodo_pago}
                          </span>
                        </td>
                        <td>{h.hora}</td>
                        <td style={{ fontWeight: 800, fontSize: 15, color: 'var(--cyan-500)' }}>
                          S/ {parseFloat(h.total).toFixed(2)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn-send"
                              style={{ padding: '4px 10px', fontSize: 11, background: '#0284c7' }}
                              onClick={() => setTicketAdmin(h)}
                            >
                              🖨️ Ver Ticket
                            </button>
                            <button
                              className="qty-btn minus"
                              style={{ width: 'auto', height: 26, padding: '0 8px', fontSize: 11, background: '#ef4444', color: '#fff' }}
                              onClick={() => handleEliminarBoleta(h.id, h.serie_correlativo)}
                              title="Anular/Eliminar Boleta"
                            >
                              🗑️ Anular
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
         4. GESTIÓN DE STOCK & INSUMOS (MATERIA PRIMA)
         ═══════════════════════════════════════════════════════════ */}
      {tab === 'insumos' && (
        <div className="admin-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3>📦 Almacén e Inventario de Insumos</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Materia prima descontada automáticamente por cada plato vendido en cocina</p>
            </div>
            <button className="btn-send" style={{ width: 'auto', padding: '8px 18px', fontSize: 13, background: '#0284c7' }} onClick={() => setShowAddInsumoModal(true)}>
              ➕ Registrar Nuevo Insumo
            </button>
          </div>

          <div className="users-table-wrap" style={{ marginTop: 15 }}>
            {loading ? <p style={{ padding: 20 }}>Cargando insumos de MySQL...</p> : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Insumo</th>
                    <th>Unidad</th>
                    <th>Stock Actual</th>
                    <th>Stock Mínimo</th>
                    <th>Costo Unitario</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {insumos.map((ins) => {
                    const bajoStock = Number(ins.stock_actual) <= Number(ins.stock_minimo);
                    return (
                      <tr key={ins.id}>
                        <td style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{ins.codigo}</td>
                        <td className="td-name">
                          <strong>{ins.nombre}</strong>
                          {ins.descripcion && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ins.descripcion}</div>}
                        </td>
                        <td><span className="role-badge" style={{ background: '#f1f5f9', color: '#334155' }}>{ins.unidad_medida}</span></td>
                        <td>
                          <span style={{
                            fontWeight: 800,
                            fontSize: 14,
                            color: bajoStock ? '#ef4444' : '#16a34a',
                            background: bajoStock ? '#fee2e2' : '#dcfce7',
                            padding: '3px 8px',
                            borderRadius: 6
                          }}>
                            {parseFloat(ins.stock_actual).toFixed(2)} {ins.unidad_medida}
                            {bajoStock && ' ⚠️'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{parseFloat(ins.stock_minimo).toFixed(2)}</td>
                        <td style={{ fontWeight: 700 }}>S/ {parseFloat(ins.costo_unitario).toFixed(2)}</td>
                        <td>
                          <button
                            className="btn-send"
                            style={{ padding: '4px 10px', fontSize: 11, background: '#3b82f6', width: 'auto' }}
                            onClick={() => abrirModalAjuste(ins)}
                          >
                            ⚖️ Movimiento Kardex
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
         4. KARDEX (LIBRO MAYOR DE MOVIMIENTOS DE INVENTARIO)
         ═══════════════════════════════════════════════════════════ */}
      {tab === 'kardex' && (
        <div className="admin-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3>📖 Libro Mayor de Inventario (Kardex Formal)</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Historial estricto de todas las entradas, salidas por comanda, mermas y devoluciones</p>
            </div>
            <div className="pos-search-wrap" style={{ width: 280 }}>
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="pos-search-input"
                placeholder="Filtrar insumo, motivo o usuario..."
                value={searchKardex}
                onChange={(e) => setSearchKardex(e.target.value)}
              />
            </div>
          </div>

          {/* Filtros Rápidos por Tipo de Movimiento */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {[
              ['TODOS', 'Todos los Movimientos'],
              ['SALIDA_VENTA', '🍽️ Salidas por Venta / Comanda'],
              ['DEVOLUCION', '↩️ Devoluciones a Almacén'],
              ['ENTRADA', '📦 Entradas / Compras'],
              ['SALIDA_MERMA', '⚠️ Mermas'],
              ['AJUSTE', '⚖️ Ajustes Físicos de Inventario']
            ].map(([tipoKey, tipoLabel]) => (
              <button
                key={tipoKey}
                className={`filter-tab ${filtroTipoKardex === tipoKey ? 'active' : ''}`}
                style={{ fontSize: 12, padding: '4px 12px' }}
                onClick={() => setFiltroTipoKardex(tipoKey)}
              >
                {tipoLabel}
              </button>
            ))}
          </div>

          <div className="users-table-wrap" style={{ marginTop: 15 }}>
            {loading ? <p style={{ padding: 20 }}>Consultando Kardex de MySQL...</p> : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Fecha & Hora</th>
                    <th>Insumo</th>
                    <th>Tipo Movimiento</th>
                    <th>Cantidad</th>
                    <th>Stock Anterior</th>
                    <th>Stock Resultante</th>
                    <th>Motivo / Referencia</th>
                    <th>Usuario Responsable</th>
                  </tr>
                </thead>
                <tbody>
                  {kardexList
                    .filter(k => {
                      // Filtro por texto
                      const matchTexto = !searchKardex || 
                        k.insumo_nombre.toLowerCase().includes(searchKardex.toLowerCase()) ||
                        k.motivo.toLowerCase().includes(searchKardex.toLowerCase()) ||
                        k.usuario_nombre.toLowerCase().includes(searchKardex.toLowerCase());
                      
                      // Filtro por tipo
                      if (!matchTexto) return false;
                      if (filtroTipoKardex === 'TODOS') return true;
                      if (filtroTipoKardex === 'SALIDA_VENTA') return k.tipo_movimiento === 'SALIDA_VENTA';
                      if (filtroTipoKardex === 'DEVOLUCION') return k.tipo_movimiento.includes('DEVOLUCION');
                      if (filtroTipoKardex === 'ENTRADA') return k.tipo_movimiento === 'ENTRADA_COMPRA' || k.tipo_movimiento === 'AJUSTE_POSITIVO';
                      if (filtroTipoKardex === 'SALIDA_MERMA') return k.tipo_movimiento === 'SALIDA_MERMA';
                      if (filtroTipoKardex === 'AJUSTE') return k.tipo_movimiento === 'AJUSTE_POSITIVO' || k.tipo_movimiento === 'AJUSTE_NEGATIVO';
                      return true;
                    })
                    .map((k) => {
                      const esDevolucion = k.tipo_movimiento.includes('DEVOLUCION');
                      const esSalida = !esDevolucion && (k.tipo_movimiento.includes('SALIDA') || k.tipo_movimiento === 'AJUSTE_NEGATIVO');
                      return (
                        <tr key={k.id}>
                          <td style={{ fontSize: 12, color: 'var(--navy-800)' }}>
                            {new Date(k.fecha_hora).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td style={{ fontWeight: 700 }}>{k.insumo_nombre}</td>
                          <td>
                            <span className="role-badge" style={{
                              background: esDevolucion ? '#dbeafe' : esSalida ? '#fee2e2' : '#dcfce7',
                              color: esDevolucion ? '#1d4ed8' : esSalida ? '#b91c1c' : '#15803d'
                            }}>
                              {esDevolucion ? '↩️ DEVOLUCIÓN ALMACÉN' : k.tipo_movimiento}
                            </span>
                          </td>
                          <td style={{ fontWeight: 800, color: esDevolucion ? '#1d4ed8' : esSalida ? '#ef4444' : '#16a34a' }}>
                            {esDevolucion ? '+' : esSalida ? '-' : '+'}{parseFloat(k.cantidad).toFixed(2)} {k.unidad_medida}
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{parseFloat(k.stock_anterior).toFixed(2)}</td>
                          <td style={{ fontWeight: 800, color: 'var(--navy-900)' }}>
                            {parseFloat(k.stock_nuevo).toFixed(2)} {k.unidad_medida}
                          </td>
                          <td style={{ fontSize: 12 }}>{k.motivo}</td>
                          <td><span className="role-badge" style={{ background: '#f1f5f9', color: '#475569' }}>{k.usuario_nombre}</span></td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
         5. CONSUMO TOTAL POR PLATO & INSUMOS GASTADOS
         ═══════════════════════════════════════════════════════════ */}
      {tab === 'consumo' && (
        <div className="admin-content">
          {/* Selector de Fecha */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)', padding: '12px 18px', borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
            <label style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy-900)' }}>📅 Seleccionar Fecha de Consumo:</label>
            <input
              type="date"
              className="modal-input"
              style={{ width: 180, fontWeight: 700 }}
              value={consumoFecha}
              onChange={(e) => setConsumoFecha(e.target.value)}
            />
            <button className="btn-send" style={{ width: 'auto', padding: '8px 16px', fontSize: 13 }} onClick={() => cargarConsumoPlatos(consumoFecha)}>
              🔄 Consultar Consumo
            </button>
          </div>

          {/* Tarjetas KPI de Consumo */}
          <div className="admin-kpis" style={{ marginTop: 14 }}>
            <div className="kpi-card kpi--navy">
              <span className="kpi-icon">🍲</span>
              <div>
                <div className="kpi-val">{consumoData.total_unidades || 0}</div>
                <div className="kpi-label">Platos consumidos el {consumoFecha}</div>
              </div>
            </div>
            <div className="kpi-card kpi--green">
              <span className="kpi-icon">💰</span>
              <div>
                <div className="kpi-val">S/ {parseFloat(consumoData.total_dinero || 0).toFixed(2)}</div>
                <div className="kpi-label">Recaudación por platos</div>
              </div>
            </div>
            <div className="kpi-card kpi--cyan">
              <span className="kpi-icon">📋</span>
              <div>
                <div className="kpi-val">{consumoData.platos?.length || 0}</div>
                <div className="kpi-label">Variedad de platos pedidos</div>
              </div>
            </div>
            <div className="kpi-card kpi--gold">
              <span className="kpi-icon">🧂</span>
              <div>
                <div className="kpi-val">{consumoData.insumos_globales?.length || 0}</div>
                <div className="kpi-label">Insumos gastados hoy</div>
              </div>
            </div>
          </div>

          {/* TABLA 1: Platos Consumidos con Insumos Gastados */}
          <div style={{ marginTop: 20 }}>
            <h3>🍽️ Consumo por Plato y Desglose de Insumos Gastados ({consumoData.platos?.length || 0})</h3>
            <div className="users-table-wrap" style={{ marginTop: 10 }}>
              {loadingConsumo ? (
                <p style={{ padding: 20 }}>Calculando consumo de platos e insumos...</p>
              ) : (!consumoData.platos || consumoData.platos.length === 0) ? (
                <p style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se registraron consumos de platos en la fecha {consumoFecha}.
                </p>
              ) : (
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Plato</th>
                      <th>Categoría</th>
                      <th>Precio Unit.</th>
                      <th>Total Pedidos</th>
                      <th>Mesas</th>
                      <th>Recaudado</th>
                      <th>🧂 Insumos Consumidos por este Plato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consumoData.platos.map((p) => (
                      <tr key={p.producto_id}>
                        <td className="td-name"><strong>{p.producto_nombre}</strong></td>
                        <td><span className="role-badge" style={{ background: '#f1f5f9', color: '#475569' }}>{p.categoria_nombre}</span></td>
                        <td>S/ {parseFloat(p.precio_unitario).toFixed(2)}</td>
                        <td style={{ fontWeight: 800, fontSize: 15, color: 'var(--navy-900)' }}>
                          {p.total_pedidos} {p.total_pedidos === 1 ? 'porción' : 'porciones'}
                        </td>
                        <td>{p.cantidad_mesas} mesas</td>
                        <td style={{ fontWeight: 800, color: 'var(--cyan-500)', fontSize: 14 }}>
                          S/ {parseFloat(p.total_recaudado).toFixed(2)}
                        </td>
                        <td>
                          {p.insumos_consumidos && p.insumos_consumidos.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 380 }}>
                              {p.insumos_consumidos.map((ins, i) => (
                                <span key={i} style={{
                                  background: '#f0fdf4',
                                  border: '1px solid #bbf7d0',
                                  color: '#166534',
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  fontSize: 11,
                                  fontWeight: 600
                                }}>
                                  • {ins.insumo_nombre}: <strong>{parseFloat(ins.total_insumo_gastado).toFixed(2)} {ins.unidad_medida}</strong> (Costo: S/ {parseFloat(ins.costo_total).toFixed(2)})
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sin receta de insumos asociada</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* TABLA 2: Insumos Globales Consumidos en el Día */}
          <div style={{ marginTop: 30 }}>
            <h3>📦 Resumen Global de Materia Prima Gastada en Cocina el {consumoFecha}</h3>
            <div className="users-table-wrap" style={{ marginTop: 10 }}>
              {(!consumoData.insumos_globales || consumoData.insumos_globales.length === 0) ? (
                <p style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hubo consumo de insumos registrado para esta fecha.
                </p>
              ) : (
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Insumo</th>
                      <th>Total Gastado Hoy</th>
                      <th>Stock Actual Restante</th>
                      <th>Costo Unitario</th>
                      <th>Costo Total Materia Prima</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consumoData.insumos_globales.map((ins) => (
                      <tr key={ins.insumo_id}>
                        <td><code>{ins.insumo_codigo}</code></td>
                        <td className="td-name"><strong>{ins.insumo_nombre}</strong></td>
                        <td style={{ fontWeight: 800, color: '#ef4444', fontSize: 14 }}>
                          - {parseFloat(ins.total_consumido).toFixed(2)} {ins.unidad_medida}
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: '#16a34a' }}>
                            {parseFloat(ins.stock_actual).toFixed(2)} {ins.unidad_medida}
                          </span>
                        </td>
                        <td>S/ {parseFloat(ins.costo_unitario).toFixed(2)}</td>
                        <td style={{ fontWeight: 800, color: 'var(--navy-900)' }}>
                          S/ {parseFloat(ins.costo_total_gastado).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
         6. CAMBIOS DE PLATO & AUDITORÍA ADMINISTRATIVA
         ═══════════════════════════════════════════════════════════ */}
      {tab === 'cambios' && (
        <div className="admin-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3>🔄 Auditoría de Cambios de Plato en Comandas</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Registro estricto de autorizaciones cuando un cliente solicita cambio de plato
              </p>
            </div>
            <button
              className="btn-send"
              style={{ width: 'auto', padding: '8px 18px', fontSize: 13, background: '#0284c7' }}
              onClick={abrirModalCambioAdmin}
            >
              ➕ Autorizar Cambio de Plato en Mesa Abierta
            </button>
          </div>

          <div className="users-table-wrap" style={{ marginTop: 15 }}>
            {loadingCambios ? (
              <p style={{ padding: 20 }}>Cargando auditoría de cambios...</p>
            ) : cambiosAuditoria.length === 0 ? (
              <p style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
                No se han registrado cambios de plato en el sistema.
              </p>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Fecha & Hora</th>
                    <th>Mesa</th>
                    <th>Plato Original</th>
                    <th>Nuevo Plato</th>
                    <th>Diferencia S/</th>
                    <th>Tratamiento Cocina</th>
                    <th>Motivo Declarado</th>
                    <th>Autorizado Por</th>
                  </tr>
                </thead>
                <tbody>
                  {cambiosAuditoria.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontSize: 12, color: 'var(--navy-800)' }}>
                        {new Date(c.created_at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td style={{ fontWeight: 700 }}>{c.mesa_nombre}</td>
                      <td>
                        <span style={{ color: '#ef4444', textDecoration: 'line-through' }}>{c.producto_anterior_nombre}</span>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>S/ {parseFloat(c.precio_anterior).toFixed(2)}</div>
                      </td>
                      <td>
                        <span style={{ color: '#16a34a', fontWeight: 700 }}>{c.producto_nuevo_nombre}</span>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>S/ {parseFloat(c.precio_nuevo).toFixed(2)}</div>
                      </td>
                      <td style={{ fontWeight: 800, color: parseFloat(c.diferencia) > 0 ? '#16a34a' : parseFloat(c.diferencia) < 0 ? '#ef4444' : '#0f172a' }}>
                        {parseFloat(c.diferencia) > 0 ? `+ S/ ${parseFloat(c.diferencia).toFixed(2)}` : parseFloat(c.diferencia) < 0 ? `- S/ ${Math.abs(parseFloat(c.diferencia)).toFixed(2)}` : 'S/ 0.00'}
                      </td>
                      <td>
                        {c.fue_merma_cocina ? (
                          <span className="role-badge" style={{ background: '#ffedd5', color: '#9a3412', border: '1px solid #fdba74' }}>
                            ⚠️ Merma Cocina
                          </span>
                        ) : (
                          <span className="role-badge" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }}>
                            📦 Devolución Almacén
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: 12, maxWidth: 220 }}>{c.motivo}</td>
                      <td><span className="role-badge" style={{ background: '#f1f5f9', color: '#334155' }}>{c.usuario_nombre}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
         7. COMPRAS A PROVEEDORES (INGRESO DE MERCADERÍA)
         ═══════════════════════════════════════════════════════════ */}
      {tab === 'compras' && (
        <div className="admin-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3>🛒 Compras a Proveedores & Ingreso de Mercadería</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Ingreso de insumos adquiridos con impacto directo en Almacén, recálculo de costos y Kardex automático
              </p>
            </div>
            <button
              className="btn-send"
              style={{ width: 'auto', padding: '8px 18px', fontSize: 13, background: '#16a34a' }}
              onClick={() => {
                setCompraForm({
                  proveedor_nombre: '',
                  proveedor_ruc: '',
                  tipo_comprobante: 'Factura',
                  serie_correlativo: generarSerieCorrelativo('Factura'),
                  fecha_compra: new Date().toISOString().split('T')[0],
                  observaciones: '',
                  items: [
                    { insumo_id: insumos[0]?.id || '', cantidad: 1, costo_unitario: insumos[0]?.costo_unitario || 10 }
                  ]
                });
                setShowAddCompraModal(true);
              }}
            >
              ➕ Registrar Compra a Proveedor
            </button>
          </div>

          <div className="users-table-wrap" style={{ marginTop: 15 }}>
            {loadingCompras ? (
              <p style={{ padding: 20 }}>Cargando compras de MySQL...</p>
            ) : compras.length === 0 ? (
              <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: 44 }}>🛒</span>
                <p style={{ fontWeight: 700, marginTop: 10 }}>No se han registrado compras a proveedores aún.</p>
                <small>Registra facturas de pescado, mariscos, verduras y bebidas para alimentar el stock automáticamente.</small>
              </div>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Proveedor / Razón Social</th>
                    <th>RUC</th>
                    <th>Comprobante</th>
                    <th>Total Compra</th>
                    <th>Insumos Comprados</th>
                    <th>Registrado Por</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {compras.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontSize: 12, color: 'var(--navy-800)' }}>
                        {c.fecha_compra ? new Date(c.fecha_compra).toLocaleDateString('es-PE') : '-'}
                      </td>
                      <td className="td-name"><strong>{c.proveedor_nombre}</strong></td>
                      <td><code>{c.proveedor_ruc || 'Sin RUC'}</code></td>
                      <td>
                        <span className="role-badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                          {c.tipo_comprobante} {c.serie_correlativo || ''}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800, fontSize: 15, color: '#16a34a' }}>
                        S/ {Number(c.total_compra || 0).toFixed(2)}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700 }}>
                          {c.items?.length || 0} {(c.items?.length === 1) ? 'ítem' : 'ítems'}
                        </span>
                      </td>
                      <td><span className="role-badge" style={{ background: '#f1f5f9', color: '#334155' }}>{c.registrado_por}</span></td>
                      <td>
                        <button
                          className="btn-clear"
                          style={{ padding: '3px 10px', fontSize: 11 }}
                          onClick={() => setCompraDetalleModal(c)}
                        >
                          👁️ Ver Detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
         8. COPIAS DE SEGURIDAD (BACKUPS SQL)
         ═══════════════════════════════════════════════════════════ */}
      {tab === 'backups' && (
        <div className="admin-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3>💾 Copias de Seguridad & Respaldo de Base de Datos</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Respaldos completos en formato .sql estándar de todas las tablas: ventas, clientes, kardex, recetas y usuarios
              </p>
            </div>
            <button
              className="btn-send"
              style={{ width: 'auto', padding: '8px 18px', fontSize: 13, background: 'var(--navy-900)' }}
              onClick={handleGenerarBackup}
              disabled={generatingBackup}
            >
              {generatingBackup ? '⏳ Generando Dump...' : '💾 Generar Backup Ahora (.sql)'}
            </button>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1px solid #86efac',
            borderRadius: 10,
            padding: '12px 16px',
            marginTop: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13,
            color: '#166534'
          }}>
            <span>
              🛡️ <strong>Automatización Activa:</strong> Cada vez que Caja pulsa <em>"🌙 Finalizar Día"</em>, se genera automáticamente una copia de respaldo fechada en la carpeta <code>/backups</code>.
            </span>
            <span style={{ fontWeight: 800 }}>Total Respaldos: {backups.length}</span>
          </div>

          <div className="users-table-wrap" style={{ marginTop: 15 }}>
            {loadingBackups ? (
              <p style={{ padding: 20 }}>Cargando backups...</p>
            ) : backups.length === 0 ? (
              <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: 44 }}>💾</span>
                <p style={{ fontWeight: 700, marginTop: 10 }}>No hay copias de seguridad generadas aún.</p>
                <small>Pulsa el botón superior para crear la primera copia de seguridad .sql.</small>
              </div>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Nombre de Archivo</th>
                    <th>Tamaño</th>
                    <th>Fecha de Generación</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((b, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700, color: 'var(--navy-900)' }}>
                        📄 {b.filename}
                      </td>
                      <td>
                        <span className="role-badge" style={{ background: '#f1f5f9', color: '#334155' }}>
                          {b.size_kb} KB
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--navy-800)' }}>{b.fecha}</td>
                      <td>
                        <a
                          href={`${API}/api/admin/backups/${b.filename}?token=${user.token}`}
                          download={b.filename}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-send"
                          style={{ display: 'inline-block', textDecoration: 'none', padding: '4px 12px', fontSize: 11, background: '#0284c7', width: 'auto' }}
                        >
                          ⬇️ Descargar SQL
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* MODALES REGISTRAR Y EDITAR USUARIOS Y PLATOS */}
      {showAddUserModal && (
        <div className="pos-modal-overlay">
          <div className="pos-modal-card" style={{ width: 420 }}>
            <div className="pos-modal-header">
              <h3>➕ Registrar Nuevo Usuario / Mesero</h3>
              <button className="modal-close-btn" onClick={() => setShowAddUserModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCrearUsuario}>
              <div className="pos-modal-body">
                <div className="modal-section">
                  <label className="modal-label">Nombre Completo</label>
                  <input type="text" className="modal-input" placeholder="Ej. Lucía Torres" value={newUser.nombre} onChange={e => setNewUser({ ...newUser, nombre: e.target.value })} />
                </div>
                <div className="modal-section">
                  <label className="modal-label">Nombre de Usuario (Login)</label>
                  <input type="text" className="modal-input" placeholder="Ej. lucia" value={newUser.usuario} onChange={e => setNewUser({ ...newUser, usuario: e.target.value.toLowerCase() })} />
                </div>
                <div className="modal-section">
                  <label className="modal-label">Contraseña</label>
                  <input type="password" className="modal-input" placeholder="••••••••" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                </div>
                <div className="modal-section">
                  <label className="modal-label">Rol en el Sistema</label>
                  <select className="modal-input" value={newUser.rol} onChange={e => setNewUser({ ...newUser, rol: e.target.value })}>
                    <option value="mesero">🧑‍🍽️ Mesero / Mesera</option>
                    <option value="cocina">👨‍🍳 Cocina</option>
                    <option value="cajero">💰 Cajero</option>
                    <option value="admin">⚙️ Administrador</option>
                  </select>
                </div>
              </div>
              <div className="pos-modal-footer">
                <button type="button" className="btn-clear" onClick={() => setShowAddUserModal(false)}>Cancelar</button>
                <button type="submit" className="btn-send" style={{ width: 'auto', padding: '8px 20px' }}>Guardar en MySQL</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditUserModal && (
        <div className="pos-modal-overlay">
          <div className="pos-modal-card" style={{ width: 420 }}>
            <div className="pos-modal-header">
              <h3>✏️ Editar Usuario & Contraseña</h3>
              <button className="modal-close-btn" onClick={() => setShowEditUserModal(false)}>✕</button>
            </div>
            <form onSubmit={handleEditarUsuario}>
              <div className="pos-modal-body">
                <div className="modal-section">
                  <label className="modal-label">Nombre Completo</label>
                  <input type="text" className="modal-input" value={editUser.nombre} onChange={e => setEditUser({ ...editUser, nombre: e.target.value })} />
                </div>
                <div className="modal-section">
                  <label className="modal-label">Nombre de Usuario (Login)</label>
                  <input type="text" className="modal-input" value={editUser.usuario} onChange={e => setEditUser({ ...editUser, usuario: e.target.value.toLowerCase() })} />
                </div>
                <div className="modal-section">
                  <label className="modal-label">Nueva Contraseña (opcional)</label>
                  <input type="password" className="modal-input" placeholder="Dejar en blanco para no cambiarla" value={editUser.password} onChange={e => setEditUser({ ...editUser, password: e.target.value })} />
                </div>
                <div className="modal-section">
                  <label className="modal-label">Rol asignado</label>
                  <select className="modal-input" value={editUser.rol} onChange={e => setEditUser({ ...editUser, rol: e.target.value })}>
                    <option value="mesero">🧑‍🍽️ Mesero / Mesera</option>
                    <option value="cocina">👨‍🍳 Cocina</option>
                    <option value="cajero">💰 Cajero</option>
                    <option value="admin">⚙️ Administrador</option>
                  </select>
                </div>
              </div>
              <div className="pos-modal-footer">
                <button type="button" className="btn-clear" onClick={() => setShowEditUserModal(false)}>Cancelar</button>
                <button type="submit" className="btn-send" style={{ width: 'auto', padding: '8px 20px' }}>Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddProductModal && (
        <div className="pos-modal-overlay">
          <div className="pos-modal-card" style={{ width: 420 }}>
            <div className="pos-modal-header">
              <h3>➕ Agregar Nuevo Plato al Menú</h3>
              <button className="modal-close-btn" onClick={() => setShowAddProductModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCrearPlato}>
              <div className="pos-modal-body">
                <div className="modal-section">
                  <label className="modal-label">Nombre del Plato o Bebida</label>
                  <input type="text" className="modal-input" placeholder="Ej. Ceviche Don Bigote Especial" value={newProduct.nombre} onChange={e => setNewProduct({ ...newProduct, nombre: e.target.value })} />
                </div>
                <div className="modal-section">
                  <label className="modal-label">Precio en Soles (S/)</label>
                  <input type="number" step="0.50" className="modal-input" placeholder="Ej. 38.00" value={newProduct.precio} onChange={e => setNewProduct({ ...newProduct, precio: e.target.value })} />
                </div>
                <div className="modal-section">
                  <label className="modal-label">Categoría</label>
                  <select className="modal-input" value={newProduct.categoria_id} onChange={e => setNewProduct({ ...newProduct, categoria_id: e.target.value })}>
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pos-modal-footer">
                <button type="button" className="btn-clear" onClick={() => setShowAddProductModal(false)}>Cancelar</button>
                <button type="submit" className="btn-send" style={{ width: 'auto', padding: '8px 20px' }}>Guardar en MySQL</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR PLATO Y PRECIO */}
      {showEditProductModal && (
        <div className="pos-modal-overlay">
          <div className="pos-modal-card" style={{ width: 440 }}>
            <div className="pos-modal-header">
              <h3>✏️ Editar Plato / Modificar Precio</h3>
              <button className="modal-close-btn" onClick={() => setShowEditProductModal(false)}>✕</button>
            </div>
            <form onSubmit={handleEditarPlato}>
              <div className="pos-modal-body">
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    🔒 <strong>Regla Crítica:</strong> Solo se puede cambiar el precio si el turno de caja está cerrado y el plato no está en comandas abiertas.
                  </div>
                </div>

                <div className="modal-section">
                  <label className="modal-label">Nombre del Plato</label>
                  <input
                    type="text"
                    className="modal-input"
                    value={editProduct.nombre}
                    onChange={e => setEditProduct({ ...editProduct, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="modal-section">
                  <label className="modal-label">Precio en Soles (S/)</label>
                  <input
                    type="number"
                    step="0.10"
                    className="modal-input"
                    value={editProduct.precio}
                    onChange={e => setEditProduct({ ...editProduct, precio: e.target.value })}
                    required
                  />
                </div>
                <div className="modal-section">
                  <label className="modal-label">Categoría</label>
                  <select
                    className="modal-input"
                    value={editProduct.categoria_id}
                    onChange={e => setEditProduct({ ...editProduct, categoria_id: e.target.value })}
                  >
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pos-modal-footer">
                <button type="button" className="btn-clear" onClick={() => setShowEditProductModal(false)}>Cancelar</button>
                <button type="submit" className="btn-send" style={{ width: 'auto', padding: '8px 20px', background: '#0284c7' }}>
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {ticketAdmin && (
        <div className="pos-modal-overlay">
          <div className="ticket-card-wrap">
            <div id="printable-ticket" className="ticket-80mm">
              <div className="ticket-header">
                <img src="/logo.jpg" alt="Don Bigote Logo" style={{ width: 48, height: 48, borderRadius: '50%' }} />
                <h2 className="ticket-brand">LA SAZÓN DE DON BIGOTE</h2>
                <p>Cebichería & Restaurante Marino</p>
                <p>RUC: 20601234567</p>
                <div className="ticket-divider" />
                <h3 className="ticket-correlativo">{ticketAdmin.tipo_comprobante}</h3>
                <h4 className="ticket-num">{ticketAdmin.serie_correlativo}</h4>
              </div>
              <div className="ticket-info">
                <div><span>Fecha/Hora:</span> <span>{ticketAdmin.fecha} {ticketAdmin.hora}</span></div>
                <div><span>Cliente:</span> <span>{ticketAdmin.nombre_cliente}</span></div>
                {ticketAdmin.doc_cliente && <div><span>Doc:</span> <span>{ticketAdmin.doc_cliente}</span></div>}
                <div><span>Atendido por:</span> <span>{ticketAdmin.mesero} ({ticketAdmin.mesa})</span></div>
                <div><span>Forma Pago:</span> <span>{ticketAdmin.metodo_pago}</span></div>
              </div>
              <div className="ticket-divider" />
              <div className="ticket-totals">
                <div><span>Op. Gravada:</span> <span>S/ {(parseFloat(ticketAdmin.total) * 0.82).toFixed(2)}</span></div>
                <div><span>IGV (18%):</span> <span>S/ {(parseFloat(ticketAdmin.total) * 0.18).toFixed(2)}</span></div>
                <div className="ticket-grand-total"><span>TOTAL:</span> <span>S/ {parseFloat(ticketAdmin.total).toFixed(2)}</span></div>
              </div>
              <div className="ticket-footer">
                <p>Comprobante registrado en el sistema Don Bigote</p>
              </div>
            </div>
            <div className="ticket-actions">
              <button className="btn-send" style={{ flex: 1 }} onClick={() => window.print()}>🖨️ Imprimir Ticket</button>
              <button className="btn-clear" onClick={() => setTicketAdmin(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AJUSTE MANUAL DE STOCK CON KARDEX */}
      {showAjusteModal && (
        <div className="pos-modal-overlay">
          <div className="pos-modal-card" style={{ width: 450 }}>
            <div className="pos-modal-header">
              <h3>📖 Movimiento en Kardex — {insumoAjuste.nombre}</h3>
              <button className="modal-close-btn" onClick={() => setShowAjusteModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAjustarStock}>
              <div className="pos-modal-body">
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, marginBottom: 14 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--navy-900)' }}>{insumoAjuste.nombre}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                    Stock registrado actual: <strong>{parseFloat(insumoAjuste.stock_actual).toFixed(2)} {insumoAjuste.unidad}</strong>
                  </div>
                </div>

                {/* 1. Tipo de Operación */}
                <div className="modal-section">
                  <label className="modal-label">1. ¿Qué deseas registrar?</label>
                  <div className="filter-tabs" style={{ marginTop: 4 }}>
                    {[
                      ['AGREGAR', '➕ Agregar (Entrada)'],
                      ['MERMA', '⚠️ Merma / Pérdida'],
                      ['AJUSTE_NEGATIVO', '➖ Quitar / Ajuste']
                    ].map(([opKey, opLabel]) => (
                      <button
                        key={opKey}
                        type="button"
                        className={`filter-tab ${insumoAjuste.tipo_operacion === opKey ? 'active' : ''}`}
                        onClick={() => {
                          let defaultMotivo = 'Compra / Ingreso de insumo';
                          if (opKey === 'MERMA') defaultMotivo = 'Merma por descongelamiento';
                          if (opKey === 'AJUSTE_NEGATIVO') defaultMotivo = 'Corrección de inventario';
                          setInsumoAjuste({ ...insumoAjuste, tipo_operacion: opKey, motivo_detalle: defaultMotivo });
                        }}
                      >
                        {opLabel}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Cantidad a Mover */}
                <div className="modal-section">
                  <label className="modal-label">
                    2. Cantidad a {insumoAjuste.tipo_operacion === 'AGREGAR' ? 'Agregar' : 'Descontar'} ({insumoAjuste.unidad})
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    className="modal-input"
                    placeholder="Ej. 2.50"
                    value={insumoAjuste.cantidad}
                    onChange={e => setInsumoAjuste({ ...insumoAjuste, cantidad: e.target.value })}
                    style={{ fontSize: 16, fontWeight: 700 }}
                    required
                  />
                  {insumoAjuste.cantidad && !isNaN(insumoAjuste.cantidad) && (
                    <small style={{ color: insumoAjuste.tipo_operacion === 'AGREGAR' ? '#16a34a' : '#ef4444', fontWeight: 600 }}>
                      Saldo final resultante en Kardex:{' '}
                      {(insumoAjuste.tipo_operacion === 'AGREGAR'
                        ? insumoAjuste.stock_actual + parseFloat(insumoAjuste.cantidad)
                        : Math.max(0, insumoAjuste.stock_actual - parseFloat(insumoAjuste.cantidad))
                      ).toFixed(2)}{' '}
                      {insumoAjuste.unidad}
                    </small>
                  )}
                </div>

                {/* 3. Motivo Específico */}
                <div className="modal-section">
                  <label className="modal-label">3. Motivo o Causa</label>
                  {insumoAjuste.tipo_operacion === 'MERMA' ? (
                    <select
                      className="modal-input"
                      value={insumoAjuste.motivo_detalle}
                      onChange={e => setInsumoAjuste({ ...insumoAjuste, motivo_detalle: e.target.value })}
                    >
                      <option value="Merma por descongelamiento">Merma técnica por descongelamiento</option>
                      <option value="Merma por deterioro / vencimiento">Merma por deterioro / vencimiento</option>
                      <option value="Merma por accidente de cocina">Merma por caída / accidente de cocina</option>
                      <option value="Merma por fileteo / corte de pescado">Merma por fileteo / corte de pescado</option>
                    </select>
                  ) : insumoAjuste.tipo_operacion === 'AGREGAR' ? (
                    <select
                      className="modal-input"
                      value={insumoAjuste.motivo_detalle}
                      onChange={e => setInsumoAjuste({ ...insumoAjuste, motivo_detalle: e.target.value })}
                    >
                      <option value="Compra / Ingreso de insumo">Compra de insumo al proveedor</option>
                      <option value="Ingreso de insumo adicional">Ingreso de stock de emergencia</option>
                      <option value="Devolución / Sobrante reutilizable">Devolución / Sobrante reutilizable</option>
                    </select>
                  ) : (
                    <select
                      className="modal-input"
                      value={insumoAjuste.motivo_detalle}
                      onChange={e => setInsumoAjuste({ ...insumoAjuste, motivo_detalle: e.target.value })}
                    >
                      <option value="Corrección de inventario">Corrección física de inventario</option>
                      <option value="Consumo de cocina / comida de personal">Consumo de cocina / comida de personal</option>
                      <option value="Ajuste por diferencia de pesaje">Ajuste por diferencia de pesaje</option>
                    </select>
                  )}
                </div>
              </div>
              <div className="pos-modal-footer">
                <button type="button" className="btn-clear" onClick={() => setShowAjusteModal(false)}>Cancelar</button>
                <button type="submit" className="btn-send" style={{ width: 'auto', padding: '8px 20px', background: insumoAjuste.tipo_operacion === 'AGREGAR' ? '#16a34a' : '#ef4444' }}>
                  {insumoAjuste.tipo_operacion === 'AGREGAR' ? '➕ Registrar Entrada en Kardex' : '➖ Registrar Salida en Kardex'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE REGISTRAR NUEVO INSUMO */}
      {showAddInsumoModal && (
        <div className="pos-modal-overlay">
          <div className="pos-modal-card" style={{ width: 440 }}>
            <div className="pos-modal-header">
              <h3>➕ Registrar Nuevo Insumo al Almacén</h3>
              <button className="modal-close-btn" onClick={() => setShowAddInsumoModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCrearInsumo}>
              <div className="pos-modal-body">
                <div className="modal-section">
                  <label className="modal-label">Código Único (Ej: INS-PES-002)</label>
                  <input
                    type="text"
                    className="modal-input"
                    placeholder="INS-..."
                    value={newInsumo.codigo}
                    onChange={e => setNewInsumo({ ...newInsumo, codigo: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
                <div className="modal-section">
                  <label className="modal-label">Nombre del Insumo / Materia Prima</label>
                  <input
                    type="text"
                    className="modal-input"
                    placeholder="Ej. Pulpo Fresco"
                    value={newInsumo.nombre}
                    onChange={e => setNewInsumo({ ...newInsumo, nombre: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="modal-section">
                    <label className="modal-label">Unidad de Medida</label>
                    <select
                      className="modal-input"
                      value={newInsumo.unidad_medida}
                      onChange={e => setNewInsumo({ ...newInsumo, unidad_medida: e.target.value })}
                    >
                      <option value="KG">Kilogramos (KG)</option>
                      <option value="GR">Gramos (GR)</option>
                      <option value="LT">Litros (LT)</option>
                      <option value="ML">Mililitros (ML)</option>
                      <option value="UND">Unidades (UND)</option>
                      <option value="PORCION">Porciones</option>
                    </select>
                  </div>
                  <div className="modal-section">
                    <label className="modal-label">Stock Inicial</label>
                    <input
                      type="number"
                      step="0.01"
                      className="modal-input"
                      placeholder="0.00"
                      value={newInsumo.stock_actual}
                      onChange={e => setNewInsumo({ ...newInsumo, stock_actual: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="modal-section">
                    <label className="modal-label">Stock Mínimo Alerta</label>
                    <input
                      type="number"
                      step="0.01"
                      className="modal-input"
                      placeholder="Ej. 2.00"
                      value={newInsumo.stock_minimo}
                      onChange={e => setNewInsumo({ ...newInsumo, stock_minimo: e.target.value })}
                    />
                  </div>
                  <div className="modal-section">
                    <label className="modal-label">Costo Unitario (S/)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="modal-input"
                      placeholder="Ej. 28.50"
                      value={newInsumo.costo_unitario}
                      onChange={e => setNewInsumo({ ...newInsumo, costo_unitario: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="pos-modal-footer">
                <button type="button" className="btn-clear" onClick={() => setShowAddInsumoModal(false)}>Cancelar</button>
                <button type="submit" className="btn-send" style={{ width: 'auto', padding: '8px 20px', background: '#0284c7' }}>
                  Guardar en Almacén
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
         MODAL: AUTORIZAR CAMBIO DE PLATO EN MESA ABIERTA (ADMIN)
         ═══════════════════════════════════════════════════════════ */}
      {showCambioPlatoModal && (
        <div className="pos-modal-overlay">
          <div className="pos-modal-card" style={{ maxWidth: 520 }}>
            <div className="pos-modal-header">
              <h3>🔄 Modificación de Comanda: Cambio o Cancelación</h3>
              <button className="modal-close-btn" onClick={() => setShowCambioPlatoModal(false)}>✕</button>
            </div>

            <div className="pos-modal-body">
              {/* Selector de Modo */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <button
                  type="button"
                  className={`filter-tab ${cambioData.modo !== 'CANCELAR' ? 'active' : ''}`}
                  style={{ flex: 1, padding: '8px 12px', fontSize: 13, fontWeight: 700 }}
                  onClick={() => setCambioData({ ...cambioData, modo: 'CAMBIAR' })}
                >
                  🔄 Reemplazar por otro Plato
                </button>
                <button
                  type="button"
                  className={`filter-tab ${cambioData.modo === 'CANCELAR' ? 'active' : ''}`}
                  style={{ flex: 1, padding: '8px 12px', fontSize: 13, fontWeight: 700, borderColor: cambioData.modo === 'CANCELAR' ? '#ef4444' : undefined, background: cambioData.modo === 'CANCELAR' ? '#fee2e2' : undefined, color: cambioData.modo === 'CANCELAR' ? '#b91c1c' : undefined }}
                  onClick={() => setCambioData({ ...cambioData, modo: 'CANCELAR' })}
                >
                  ❌ Anular / Devolver Plato
                </button>
              </div>

              <div style={{ background: '#f0f9ff', padding: '10px 14px', borderRadius: 8, marginBottom: 14, border: '1px solid #bae6fd', fontSize: 12, color: '#0369a1' }}>
                ℹ️ <strong>Control de Kardex:</strong> Si el plato está en estado 'Pendiente' (sin cocinar), sus insumos regresan automáticamente al stock y se asientan en el Kardex como <em>ENTRADA_DEVOLUCION</em>. Si ya estaba en cocina, se asienta como merma.
              </div>

              {/* 1. Seleccionar Mesa Abierta */}
              <div className="modal-section">
                <label className="modal-label">1. Seleccionar Mesa con Comanda Abierta</label>
                <select
                  className="modal-input"
                  value={cambioData.pedido_id}
                  onChange={(e) => {
                    const pedId = Number(e.target.value);
                    const ped = pedidosAbiertos.find(p => p.pedido_id === pedId);
                    const primerItem = ped?.items?.[0] || null;
                    setCambioData({
                      ...cambioData,
                      pedido_id: pedId,
                      detalle_id: primerItem?.detalle_id || '',
                      itemObj: primerItem
                    });
                  }}
                >
                  <option value="">-- Selecciona una mesa --</option>
                  {pedidosAbiertos.map(p => (
                    <option key={p.pedido_id} value={p.pedido_id}>
                      {p.mesa} — Mesero: {p.mesero} (Total: S/ {parseFloat(p.total).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Seleccionar Plato de la Mesa a Reemplazar o Cancelar */}
              {cambioData.pedido_id && (
                <div className="modal-section" style={{ marginTop: 12 }}>
                  <label className="modal-label">2. Plato de la Mesa a {cambioData.modo === 'CANCELAR' ? 'Anular / Cancelar' : 'Reemplazar'}</label>
                  {(() => {
                    const ped = pedidosAbiertos.find(p => p.pedido_id === Number(cambioData.pedido_id));
                    const items = ped?.items || [];
                    return (
                      <select
                        className="modal-input"
                        value={cambioData.detalle_id}
                        onChange={(e) => {
                          const detId = Number(e.target.value);
                          const it = items.find(i => i.detalle_id === detId);
                          setCambioData({
                            ...cambioData,
                            detalle_id: detId,
                            itemObj: it
                          });
                        }}
                      >
                        <option value="">-- Selecciona el plato --</option>
                        {items.map(it => (
                          <option key={it.detalle_id} value={it.detalle_id}>
                            {it.cantidad}x {it.nombre} (S/ {parseFloat(it.precio || 0).toFixed(2)} c/u) — Cocina: {it.estado_cocina || 'Pendiente'}
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </div>
              )}

              {/* Advertencia del Estado en Cocina */}
              {cambioData.itemObj && (
                <div style={{
                  marginTop: 10,
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  background: cambioData.itemObj.estado_cocina === 'Pendiente' ? '#dcfce7' : '#ffedd5',
                  border: `1px solid ${cambioData.itemObj.estado_cocina === 'Pendiente' ? '#86efac' : '#fdba74'}`,
                  color: cambioData.itemObj.estado_cocina === 'Pendiente' ? '#166534' : '#9a3412'
                }}>
                  {cambioData.itemObj.estado_cocina === 'Pendiente' ? (
                    <div>
                      ✅ <strong>Plato no iniciado en cocina (Pendiente):</strong>
                      <div style={{ marginTop: 2 }}>
                        Los insumos se devolverán íntegramente al Almacén y al Kardex como <em>ENTRADA_DEVOLUCION</em>.
                      </div>
                    </div>
                  ) : (
                    <div>
                      ⚠️ <strong>Plato en cocina ({cambioData.itemObj.estado_cocina}):</strong>
                      <div style={{ marginTop: 2 }}>
                        La materia prima ya fue preparada. Se declarará automáticamente como <strong>MERMA DE COCINA</strong>.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Seleccionar el Nuevo Plato (Solo si modo es CAMBIAR) */}
              {cambioData.modo !== 'CANCELAR' ? (
                <>
                  <div className="modal-section" style={{ marginTop: 14 }}>
                    <label className="modal-label">3. Nuevo Plato Requerido</label>
                    <select
                      className="modal-input"
                      value={cambioData.nuevo_producto_id}
                      onChange={(e) => setCambioData({ ...cambioData, nuevo_producto_id: Number(e.target.value) })}
                    >
                      <option value="">-- Selecciona el nuevo plato del menú --</option>
                      {productos.filter(p => p.disponible).map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} ({p.categoria}) — S/ {parseFloat(p.precio).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cálculo de Diferencia */}
                  {cambioData.itemObj && cambioData.nuevo_producto_id && (() => {
                    const nuevo = productos.find(p => p.id === Number(cambioData.nuevo_producto_id));
                    const precioAnt = parseFloat(cambioData.itemObj.precio || 0);
                    const precioNuev = nuevo ? parseFloat(nuevo.precio) : 0;
                    const cant = Number(cambioData.itemObj.cantidad || 1);
                    const dif = (precioNuev - precioAnt) * cant;
                    return (
                      <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, marginTop: 10, border: '1px solid #e2e8f0', fontSize: 13 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                          <span>Plato actual: {cambioData.itemObj.nombre}</span>
                          <span>S/ {(precioAnt * cant).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0f172a', fontWeight: 700, marginTop: 3 }}>
                          <span>Nuevo plato: {nuevo?.nombre}</span>
                          <span>S/ {(precioNuev * cant).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTop: '1px dashed #cbd5e1', fontWeight: 800 }}>
                          <span>Ajuste en la comanda:</span>
                          <span style={{ color: dif > 0 ? '#16a34a' : dif < 0 ? '#ef4444' : '#0f172a' }}>
                            {dif > 0 ? `+ S/ ${dif.toFixed(2)}` : dif < 0 ? `- S/ ${Math.abs(dif).toFixed(2)}` : 'S/ 0.00'}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                cambioData.itemObj && (
                  <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: '10px 14px', borderRadius: 8, marginTop: 12, fontSize: 13, color: '#9f1239' }}>
                    <div style={{ fontWeight: 800 }}>❌ Resumen de Anulación:</div>
                    <div style={{ marginTop: 4 }}>
                      Se eliminará de la comanda: <strong>{cambioData.itemObj.cantidad}x {cambioData.itemObj.nombre}</strong>.
                    </div>
                    <div style={{ marginTop: 2, fontWeight: 700 }}>
                      Monto a descontar de la cuenta: - S/ {(parseFloat(cambioData.itemObj.precio || 0) * Number(cambioData.itemObj.cantidad || 1)).toFixed(2)}
                    </div>
                  </div>
                )
              )}

              {/* 4. Motivo */}
              <div className="modal-section" style={{ marginTop: 14 }}>
                <label className="modal-label">4. Motivo Obligatorio</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="Ej. Cliente cambió de opinión, solicitud antes de cocción..."
                  value={cambioData.motivo}
                  onChange={(e) => setCambioData({ ...cambioData, motivo: e.target.value })}
                />
              </div>
            </div>

            <div className="pos-modal-footer">
              <button className="btn-clear" onClick={() => setShowCambioPlatoModal(false)}>Cancelar</button>
              <button
                className="btn-send"
                style={{ width: 'auto', padding: '10px 22px', background: cambioData.modo === 'CANCELAR' ? '#dc2626' : undefined }}
                onClick={handleEjecutarCambioAdmin}
                disabled={submittingCambio}
              >
                {submittingCambio ? 'Procesando...' : cambioData.modo === 'CANCELAR' ? '❌ Confirmar Anulación & Devolución a Kardex' : '✅ Confirmar Cambio en Comanda'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR COMPRA A PROVEEDOR */}
      {showAddCompraModal && (
        <div className="pos-modal-overlay">
          <div className="pos-modal-card" style={{ maxWidth: 700, width: '95%' }}>
            <div className="pos-modal-header">
              <h3>🛒 Registrar Compra a Proveedor (Ingreso de Mercadería)</h3>
              <button className="modal-close-btn" onClick={() => setShowAddCompraModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCrearCompra}>
              <div className="pos-modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, marginBottom: 14, border: '1px solid #e2e8f0' }}>
                  
                  {/* Selector Rápido de Proveedor del Catálogo de 50 */}
                  <div style={{ marginBottom: 12, background: '#e0f2fe', padding: '10px 12px', borderRadius: 8, border: '1px solid #bae6fd' }}>
                    <label className="modal-label" style={{ fontWeight: 700, color: '#0369a1', marginBottom: 4 }}>
                      ⚡ Selección Rápida de Proveedor (50 Empresas Registradas)
                    </label>
                    <select
                      className="modal-input"
                      style={{ background: '#ffffff', fontWeight: 600, borderColor: '#7dd3fc' }}
                      onChange={e => {
                        const provId = Number(e.target.value);
                        if (!provId) return;
                        const prov = proveedoresList.find(p => p.id === provId);
                        if (prov) {
                          const nombreFinal = prov.razon_social || prov.nombre_empresa || prov.nombre_comercial || '';
                          setCompraForm(prev => ({
                            ...prev,
                            proveedor_nombre: nombreFinal,
                            proveedor_ruc: prov.ruc || ''
                          }));
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="">-- Elige un distribuidor para autocompletar Razón Social y RUC --</option>
                      {proveedoresList.map(p => {
                        const nombreFinal = p.razon_social || p.nombre_empresa || p.nombre_comercial || '';
                        return (
                          <option key={p.id} value={p.id}>
                            [{p.categoria || 'PROVEEDOR'}] {nombreFinal} — RUC: {p.ruc}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                    <div>
                      <label className="modal-label">Proveedor / Razón Social *</label>
                      <input
                        type="text"
                        className="modal-input"
                        placeholder="Escribe o selecciona proveedor..."
                        list="datalist-proveedores"
                        value={compraForm.proveedor_nombre}
                        onChange={e => {
                          const val = e.target.value;
                          const found = proveedoresList.find(p => {
                            const n = (p.razon_social || p.nombre_empresa || p.nombre_comercial || '').toLowerCase();
                            return n === val.toLowerCase() || p.ruc === val;
                          });
                          setCompraForm(prev => ({
                            ...prev,
                            proveedor_nombre: val,
                            proveedor_ruc: found ? (found.ruc || prev.proveedor_ruc) : prev.proveedor_ruc
                          }));
                        }}
                        required
                      />
                      <datalist id="datalist-proveedores">
                        {proveedoresList.map(p => {
                          const nombreFinal = p.razon_social || p.nombre_empresa || p.nombre_comercial || '';
                          return (
                            <option key={p.id} value={nombreFinal}>
                              RUC: {p.ruc} [{p.categoria}]
                            </option>
                          );
                        })}
                      </datalist>
                    </div>
                    <div>
                      <label className="modal-label">RUC Proveedor (11 dígitos)</label>
                      <input
                        type="text"
                        className="modal-input"
                        placeholder="Ej. 20601234567"
                        maxLength={11}
                        value={compraForm.proveedor_ruc}
                        onChange={e => setCompraForm({ ...compraForm, proveedor_ruc: e.target.value.replace(/\D/g, '') })}
                      />
                    </div>
                    <div>
                      <label className="modal-label">Tipo Comprobante</label>
                      <select
                        className="modal-input"
                        value={compraForm.tipo_comprobante}
                        onChange={e => {
                          const nuevoTipo = e.target.value;
                          setCompraForm(prev => ({
                            ...prev,
                            tipo_comprobante: nuevoTipo,
                            serie_correlativo: generarSerieCorrelativo(nuevoTipo)
                          }));
                        }}
                      >
                        <option value="Factura">🏢 Factura</option>
                        <option value="Boleta">📄 Boleta</option>
                        <option value="Guía Remisión">🚚 Guía de Remisión</option>
                        <option value="Ticket">🧾 Ticket / Recibo</option>
                      </select>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="modal-label" style={{ margin: 0 }}>Serie y Correlativo *</label>
                        <button
                          type="button"
                          style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 11, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => setCompraForm(prev => ({ ...prev, serie_correlativo: generarSerieCorrelativo(prev.tipo_comprobante) }))}
                        >
                          ⚡ Auto Generar
                        </button>
                      </div>
                      <input
                        type="text"
                        className="modal-input"
                        placeholder="Ej. F001-002891"
                        value={compraForm.serie_correlativo}
                        onChange={e => setCompraForm({ ...compraForm, serie_correlativo: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="modal-label">Fecha de Compra</label>
                      <input
                        type="date"
                        className="modal-input"
                        value={compraForm.fecha_compra}
                        onChange={e => setCompraForm({ ...compraForm, fecha_compra: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="modal-label">Observaciones</label>
                      <input
                        type="text"
                        className="modal-input"
                        placeholder="Ej. Pago al contado / Lote fresco"
                        value={compraForm.observaciones}
                        onChange={e => setCompraForm({ ...compraForm, observaciones: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Tabla de ítems comprados */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0 8px 0' }}>
                  <label className="modal-label" style={{ margin: 0, fontSize: 14 }}>
                    📦 Insumos / Materia Prima Adquirida ({compraForm.items.length})
                  </label>
                  <button
                    type="button"
                    className="btn-clear"
                    style={{ padding: '4px 12px', fontSize: 12, borderColor: '#16a34a', color: '#16a34a', fontWeight: 700 }}
                    onClick={() => {
                      const primerInsumo = insumos[0];
                      setCompraForm({
                        ...compraForm,
                        items: [
                          ...compraForm.items,
                          {
                            insumo_id: primerInsumo?.id || '',
                            cantidad: 1,
                            costo_unitario: Number(primerInsumo?.costo_unitario || 10)
                          }
                        ]
                      });
                    }}
                  >
                    ➕ Agregar Fila de Insumo
                  </button>
                </div>

                {compraForm.items.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', background: '#f8fafc', borderRadius: 8, color: 'var(--text-muted)' }}>
                    Pulsa "Agregar Fila de Insumo" para ingresar los productos de la factura.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {compraForm.items.map((it, idx) => {
                      const insumoSel = insumos.find(i => i.id === Number(it.insumo_id));
                      const sub = (Number(it.cantidad || 0) * Number(it.costo_unitario || 0));
                      return (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 36px', gap: 8, alignItems: 'center', background: '#f8fafc', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                          <div>
                            <select
                              className="modal-input"
                              style={{ fontSize: 12, padding: '6px 8px' }}
                              value={it.insumo_id}
                              onChange={e => {
                                const id = Number(e.target.value);
                                const found = insumos.find(i => i.id === id);
                                const nextItems = [...compraForm.items];
                                nextItems[idx] = {
                                  ...nextItems[idx],
                                  insumo_id: id,
                                  costo_unitario: found?.costo_unitario || nextItems[idx].costo_unitario
                                };
                                setCompraForm({ ...compraForm, items: nextItems });
                              }}
                            >
                              {insumos.map(ins => (
                                <option key={ins.id} value={ins.id}>
                                  {ins.nombre} ({ins.unidad_medida}) — Stock act: {Number(ins.stock_actual).toFixed(1)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              className="modal-input"
                              placeholder="Cant."
                              style={{ fontSize: 13, fontWeight: 700 }}
                              value={it.cantidad}
                              onChange={e => {
                                const nextItems = [...compraForm.items];
                                nextItems[idx] = { ...nextItems[idx], cantidad: e.target.value };
                                setCompraForm({ ...compraForm, items: nextItems });
                              }}
                              title={`Cantidad en ${insumoSel?.unidad_medida || 'unidad'}`}
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              className="modal-input"
                              placeholder="Costo S/"
                              style={{ fontSize: 13, fontWeight: 700 }}
                              value={it.costo_unitario}
                              onChange={e => {
                                const nextItems = [...compraForm.items];
                                nextItems[idx] = { ...nextItems[idx], costo_unitario: e.target.value };
                                setCompraForm({ ...compraForm, items: nextItems });
                              }}
                              title="Costo Unitario en Soles"
                            />
                          </div>
                          <div style={{ textAlign: 'right', fontWeight: 800, fontSize: 13, color: '#16a34a' }}>
                            S/ {sub.toFixed(2)}
                          </div>
                          <div>
                            <button
                              type="button"
                              className="qty-btn minus"
                              style={{ width: 28, height: 28, fontSize: 13 }}
                              onClick={() => {
                                const nextItems = compraForm.items.filter((_, i) => i !== idx);
                                setCompraForm({ ...compraForm, items: nextItems });
                              }}
                              title="Eliminar fila"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Total de la compra */}
                {(() => {
                  const total = compraForm.items.reduce((acc, it) => acc + (Number(it.cantidad || 0) * Number(it.costo_unitario || 0)), 0);
                  return (
                    <div style={{ marginTop: 14, padding: '12px 16px', background: '#ecfdf5', borderRadius: 8, border: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: '#065f46' }}>TOTAL DE LA COMPRA:</span>
                      <span style={{ fontSize: 20, fontWeight: 900, color: '#047857' }}>S/ {total.toFixed(2)}</span>
                    </div>
                  );
                })()}
              </div>

              <div className="pos-modal-footer">
                <button type="button" className="btn-clear" onClick={() => setShowAddCompraModal(false)}>Cancelar</button>
                <button
                  type="submit"
                  className="btn-send"
                  style={{ width: 'auto', padding: '10px 24px', background: '#16a34a' }}
                  disabled={submittingCompra || compraForm.items.length === 0}
                >
                  {submittingCompra ? 'Guardando en Kardex...' : '💾 Registrar Compra & Actualizar Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VER DETALLE DE COMPRA */}
      {compraDetalleModal && (
        <div className="pos-modal-overlay">
          <div className="pos-modal-card" style={{ maxWidth: 560 }}>
            <div className="pos-modal-header">
              <h3>📦 Detalle de Compra #{compraDetalleModal.id}</h3>
              <button className="modal-close-btn" onClick={() => setCompraDetalleModal(null)}>✕</button>
            </div>
            <div className="pos-modal-body">
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 14, fontSize: 13, border: '1px solid #e2e8f0' }}>
                <div><strong>Proveedor:</strong> {compraDetalleModal.proveedor_nombre}</div>
                {compraDetalleModal.proveedor_ruc && <div><strong>RUC:</strong> {compraDetalleModal.proveedor_ruc}</div>}
                <div><strong>Comprobante:</strong> {compraDetalleModal.tipo_comprobante} {compraDetalleModal.serie_correlativo}</div>
                <div><strong>Fecha:</strong> {compraDetalleModal.fecha_compra ? new Date(compraDetalleModal.fecha_compra).toLocaleDateString('es-PE') : '-'}</div>
                <div><strong>Registrado por:</strong> {compraDetalleModal.registrado_por}</div>
                {compraDetalleModal.observaciones && <div><strong>Notas:</strong> {compraDetalleModal.observaciones}</div>}
              </div>

              <div className="users-table-wrap">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Insumo</th>
                      <th>Cantidad</th>
                      <th>Costo Unit.</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compraDetalleModal.items && compraDetalleModal.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="td-name"><strong>{it.insumo_nombre}</strong></td>
                        <td>{Number(it.cantidad).toFixed(2)} {it.unidad_medida}</td>
                        <td>S/ {Number(it.costo_unitario).toFixed(2)}</td>
                        <td style={{ fontWeight: 800, color: '#16a34a' }}>S/ {Number(it.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 12, textAlign: 'right', fontSize: 16, fontWeight: 900, color: '#047857' }}>
                Total Compra: S/ {Number(compraDetalleModal.total_compra || 0).toFixed(2)}
              </div>
            </div>
            <div className="pos-modal-footer">
              <button className="btn-clear" onClick={() => setCompraDetalleModal(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


