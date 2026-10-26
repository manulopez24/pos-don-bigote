import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { socket } from './socket';

const API = ``;

export default function CashierView({ user }) {
  const [tab,          setTab]          = useState('cuentas'); // 'cuentas' | 'historial'
  const [cuentas,      setCuentas]      = useState([]);
  const [historial,    setHistorial]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [submitting,   setSubmitting]   = useState(false);

  // Estado del Modal de Cobro
  const [selectedCuenta, setSelectedCuenta] = useState(null);
  const [tipoDoc,        setTipoDoc]        = useState('Boleta Simple'); // 'Boleta Simple' | 'Boleta con DNI' | 'Factura'
  const [docNum,         setDocNum]         = useState('');
  const [clienteNombre,  setClienteNombre]  = useState('PÚBLICO GENERAL');
  const [metodoPago,     setMetodoPago]     = useState('Efectivo'); // 'Efectivo' | 'Yape' | 'Mixto'
  const [montoPaga,      setMontoPaga]      = useState('');
  const [propina,        setPropina]        = useState(0);
  const [montoEfectivoMixto, setMontoEfectivoMixto] = useState('');
  const [montoYapeMixto,     setMontoYapeMixto]     = useState('');
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [clienteAutocompletado, setClienteAutocompletado] = useState(null);
  const [descuentoFidelidad, setDescuentoFidelidad] = useState(false);

  // Estado del Tab de Propinas de Meseros
  const [propinasData, setPropinasData] = useState({ meseros: [], total_general: 0 });
  const [loadingPropinas, setLoadingPropinas] = useState(false);
  const [fechaPropinas, setFechaPropinas] = useState(new Date().toISOString().split('T')[0]);

  // Estado del Modal de Ticket Imprimible
  const [ticketEmitido,  setTicketEmitido]  = useState(null);

  // Estado del Cierre de Caja en 2 Niveles (Medio Día vs Fin de Día)
  const [showZReport, setShowZReport] = useState(false);
  const [tipoCierreModal, setTipoCierreModal] = useState('MEDIO_DIA'); // 'MEDIO_DIA' | 'FIN_DIA'
  const [observacionesCierre, setObservacionesCierre] = useState('');
  const [zStats, setZStats] = useState(null);
  const [ticketZEmitido, setTicketZEmitido] = useState(null);
  const [cerrarBannerMedioDia, setCerrarBannerMedioDia] = useState(false);
  const [showHistorialCierresModal, setShowHistorialCierresModal] = useState(false);

  // Estado de la Jornada (Medio Día Cerrado / Fin de Día / Ventas Bloqueadas)
  const [estadoJornada, setEstadoJornada] = useState({
    ventas_bloqueadas: false,
    medio_dia_cerrado: false,
    mi_medio_dia_cerrado: false,
    ultimo_cierre_medio_dia: null,
    fin_dia_cerrado: false,
    ultimo_cierre_fin_dia: null,
    cierres_hoy: []
  });

  // Estado del Modal de Pre-Cuenta
  const [preCuentaEmitida, setPreCuentaEmitida] = useState(null);

  // Caché local en memoria para búsquedas instantáneas en 0ms y guardado rápido
  const [clientesCache, setClientesCache] = useState({});
  const [guardandoCliente, setGuardandoCliente] = useState(false);

  // Estado del Modal de Cambio de Plato Autorizado (Supervisión Caja)
  const [showCambioPlatoModal, setShowCambioPlatoModal] = useState(false);
  const [cambioPlatoData, setCambioPlatoData] = useState({
    pedido_id: '',
    detalle_id: '',
    nuevo_producto_id: '',
    motivo: '',
    platoSeleccionadoObj: null,
    modo: 'CAMBIAR'
  });
  const [menuPlatosDisponibles, setMenuPlatosDisponibles] = useState([]);

  // Precargar clientes para búsquedas inmediatas a 0ms sin latencia de red
  const cargarClientesCache = useCallback(() => {
    axios.get(`${API}/api/clientes/todos`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(({ data }) => {
        if (Array.isArray(data)) {
          const dict = {};
          data.forEach(c => {
            if (c.dni) dict[c.dni] = c;
          });
          setClientesCache(dict);
        }
      })
      .catch(err => console.error('Error precargando clientes:', err));
  }, [user.token]);

  // Consultar estado de jornada (cierres y bloqueo de ventas)
  const cargarEstadoJornada = useCallback(() => {
    axios.get(`${API}/api/caja/estado-jornada`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(({ data }) => setEstadoJornada(data))
      .catch((err) => console.error('Error cargando estado jornada:', err));
  }, [user.token]);

  // Cargar cuentas abiertas de MySQL
  const cargarCuentasBD = useCallback(() => {
    axios.get(`${API}/api/caja/pedidos`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(({ data }) => setCuentas(data))
      .catch((err) => console.error('Error cargando caja:', err));
  }, [user.token]);

  // Cargar historial de boletas emitidas
  const cargarHistorialBD = useCallback(() => {
    axios.get(`${API}/api/caja/comprobantes`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(({ data }) => setHistorial(data))
      .catch((err) => console.error('Error cargando historial:', err));
  }, [user.token]);

  // Cargar reporte y liquidación de propinas de meseros
  const cargarPropinasBD = useCallback((fecha = fechaPropinas) => {
    setLoadingPropinas(true);
    axios.get(`${API}/api/caja/propinas-meseros?fecha=${fecha}`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(({ data }) => setPropinasData(data || { meseros: [], total_general: 0 }))
      .catch((err) => console.error('Error cargando propinas:', err))
      .finally(() => setLoadingPropinas(false));
  }, [user.token, fechaPropinas]);

  // Reactivar ventas por Administrador
  const reactivarVentasAdmin = async () => {
    if (!window.confirm('¿Deseas reactivar las ventas y aperturar una nueva jornada de operaciones?')) return;
    try {
      const { data } = await axios.post(`${API}/api/admin/jornada/reactivar`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert(data.message || '✅ Ventas reactivadas exitosamente.');
      cargarEstadoJornada();
      cargarCuentasBD();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al reactivar ventas.');
    }
  };

  // TIEMPO REAL: WebSockets con Socket.io (reemplaza polling en Caja)
  useEffect(() => {
    setLoading(true);
    Promise.all([cargarCuentasBD(), cargarHistorialBD(), cargarPropinasBD(), cargarEstadoJornada(), cargarClientesCache()])
      .finally(() => setLoading(false));

    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('unirse_sala', { rol: 'cajero', usuario_id: user?.id });

    const handleActualizarCaja = () => {
      cargarCuentasBD();
      cargarHistorialBD();
      cargarPropinasBD();
      cargarEstadoJornada();
    };

    const handleEstadoJornada = () => {
      cargarEstadoJornada();
      cargarCuentasBD();
    };

    socket.on('NUEVA_COMANDA', handleActualizarCaja);
    socket.on('PEDIDO_COBRADO', handleActualizarCaja);
    socket.on('CAMBIO_MESAS', handleActualizarCaja);
    socket.on('ESTADO_JORNADA_ACTUALIZADO', handleEstadoJornada);
    socket.on('VENTAS_BLOQUEADAS', handleEstadoJornada);
    socket.on('VENTAS_REACTIVADAS', handleEstadoJornada);

    return () => {
      socket.off('NUEVA_COMANDA', handleActualizarCaja);
      socket.off('PEDIDO_COBRADO', handleActualizarCaja);
      socket.off('CAMBIO_MESAS', handleActualizarCaja);
      socket.off('ESTADO_JORNADA_ACTUALIZADO', handleEstadoJornada);
      socket.off('VENTAS_BLOQUEADAS', handleEstadoJornada);
      socket.off('VENTAS_REACTIVADAS', handleEstadoJornada);
    };
  }, [cargarCuentasBD, cargarHistorialBD, cargarPropinasBD, cargarEstadoJornada, user?.id]);

  // Cambiar tipo de comprobante con reseteo absoluto de estados
  const cambiarTipoDoc = (tipo) => {
    setTipoDoc(tipo);
    setDocNum('');
    setClienteAutocompletado(null);
    setDescuentoFidelidad(false);
    if (tipo === 'Boleta Simple') {
      setClienteNombre('PÚBLICO GENERAL');
    } else {
      setClienteNombre('');
    }
    if (selectedCuenta) {
      setMontoPaga(parseFloat(selectedCuenta.total).toFixed(2));
    }
  };

  // Aplicar cliente encontrado a los campos y recalcular beneficios
  const aplicarClienteEncontrado = useCallback((cli) => {
    const nom = cli.nombre || cli.nombre_completo;
    const vis = Number(cli.visitas || cli.total_visitas || 1);
    setClienteNombre(nom);
    setClienteAutocompletado({ ...cli, nombre: nom, visitas: vis, nuevo: false });

    if (vis >= 5) {
      setDescuentoFidelidad(true);
      const sub = selectedCuenta ? parseFloat(selectedCuenta.total) : 0;
      const desc = sub * 0.20;
      setMontoPaga((sub - desc).toFixed(2));
    } else {
      setDescuentoFidelidad(false);
      if (selectedCuenta) {
        setMontoPaga(parseFloat(selectedCuenta.total).toFixed(2));
      }
    }
  }, [selectedCuenta]);

  // Búsqueda instantánea de cliente por DNI/RUC con validación rigurosa
  const handleCambioDoc = async (valor) => {
    const limpio = valor.replace(/\D/g, '');
    const len = tipoDoc === 'Factura' ? 11 : 8;
    const docTruncado = limpio.slice(0, len);
    setDocNum(docTruncado);

    setClienteAutocompletado(null);
    setDescuentoFidelidad(false);
    if (tipoDoc !== 'Boleta Simple') {
      setClienteNombre('');
    }

    if (docTruncado.length === len) {
      // 1. Verificación en memoria caché instantánea (0ms)
      if (clientesCache[docTruncado]) {
        aplicarClienteEncontrado(clientesCache[docTruncado]);
        return;
      }

      // 2. Consulta al backend si no estuviera en caché
      setBuscandoCliente(true);
      try {
        const { data } = await axios.get(`${API}/api/clientes/buscar?doc=${docTruncado}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        if (data.encontrado && data.cliente) {
          aplicarClienteEncontrado(data.cliente);
          setClientesCache(prev => ({ ...prev, [docTruncado]: data.cliente }));
        } else {
          // Cliente nuevo
          setClienteNombre('');
          setClienteAutocompletado({ nuevo: true });
          setDescuentoFidelidad(false);
        }
      } catch (err) {
        console.error('Error buscando cliente:', err);
      } finally {
        setBuscandoCliente(false);
      }
    } else {
      if (selectedCuenta) {
        setMontoPaga(parseFloat(selectedCuenta.total).toFixed(2));
      }
    }
  };

  // Botón manual de búsqueda para cuando se pega un DNI
  const buscarDocManual = (docManual = docNum) => {
    const limpio = (docManual || '').replace(/\D/g, '');
    const len = tipoDoc === 'Factura' ? 11 : 8;
    if (limpio.length < len) {
      alert(`⚠️ Ingresa los ${len} dígitos completos para buscar (${tipoDoc === 'Factura' ? 'RUC' : 'DNI'}).`);
      return;
    }
    handleCambioDoc(limpio);
  };

  // Guardado manual rápido de cliente nuevo antes de cobrar
  const handleGuardarClienteRapido = async () => {
    if (!docNum || docNum.length !== lenRequerida) {
      alert(`⚠️ Ingresa un ${tipoDoc === 'Factura' ? 'RUC de 11 dígitos' : 'DNI de 8 dígitos'} válido.`);
      return;
    }
    const nom = (clienteNombre || '').trim();
    if (!nom || nom === 'PÚBLICO GENERAL' || nom.length < 3) {
      alert('⚠️ Ingresa el nombre completo del cliente (mínimo 3 caracteres).');
      return;
    }
    setGuardandoCliente(true);
    try {
      await axios.post(`${API}/api/clientes/auto-registrar`, {
        dni: docNum,
        nombre: nom
      }, { headers: { Authorization: `Bearer ${user.token}` } });

      const nuevoObj = { dni: docNum, nombre: nom, visitas: 1, nuevo: false };
      setClienteAutocompletado(nuevoObj);
      setClientesCache(prev => ({ ...prev, [docNum]: nuevoObj }));
      alert(`✅ ¡Cliente '${nom}' registrado con éxito en el sistema!`);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al registrar cliente.');
    } finally {
      setGuardandoCliente(false);
    }
  };

  // Abrir modal de cobro
  const abrirModalCobro = (cuenta) => {
    setSelectedCuenta(cuenta);
    setTipoDoc('Boleta Simple');
    setDocNum('');
    setClienteNombre('PÚBLICO GENERAL');
    setMetodoPago('Efectivo');
    setPropina(0);
    setMontoEfectivoMixto('');
    setMontoYapeMixto('');
    setMontoPaga(parseFloat(cuenta.total).toFixed(2));
    setClienteAutocompletado(null);
    setDescuentoFidelidad(false);
  };

  // Cálculo de totales y promoción de 5 visitas (20% de descuento) + Propina voluntaria
  const lenRequerida = tipoDoc === 'Factura' ? 11 : 8;
  const esDocCompleto = docNum.length === lenRequerida;
  const clienteVerificado = esDocCompleto && !!clienteAutocompletado && !clienteAutocompletado.nuevo;
  const clienteNuevo = esDocCompleto && !!clienteAutocompletado?.nuevo;
  const cantVisitas = clienteVerificado ? Number(clienteAutocompletado.visitas || clienteAutocompletado.total_visitas || 1) : 0;
  const tienePromo5Visitas = clienteVerificado && cantVisitas >= 5;

  const subtotalBase = selectedCuenta ? parseFloat(selectedCuenta.total) : 0;
  const montoDescuento = (descuentoFidelidad && tienePromo5Visitas) ? (subtotalBase * 0.20) : 0;
  const montoPropina = Math.max(0, parseFloat(propina) || 0);
  const totalPagar = Math.max(0, (subtotalBase - montoDescuento) + montoPropina);

  const pagaMonto = metodoPago === 'Mixto'
    ? ((parseFloat(montoEfectivoMixto) || 0) + (parseFloat(montoYapeMixto) || 0))
    : (parseFloat(montoPaga) || 0);
  const vuelto = metodoPago === 'Mixto'
    ? Math.max(0, ((parseFloat(montoEfectivoMixto) || 0) + (parseFloat(montoYapeMixto) || 0)) - totalPagar)
    : Math.max(0, pagaMonto - totalPagar);

  // Procesar cobro y emitir boleta con validaciones estrictas
  const handleConfirmarCobro = async () => {
    if (!selectedCuenta || submitting) return;

    if (tipoDoc === 'Boleta con DNI') {
      if (!/^\d{8}$/.test(docNum)) {
        alert('⚠️ El DNI debe tener exactamente 8 dígitos numéricos.');
        return;
      }
      const nombreLimpio = (clienteNombre || '').trim();
      if (!nombreLimpio || nombreLimpio === 'PÚBLICO GENERAL') {
        alert('⚠️ Por favor ingresa el nombre y apellido del cliente para la boleta con DNI.');
        return;
      }
      if (nombreLimpio.length < 3) {
        alert('⚠️ El nombre del cliente debe tener al menos 3 caracteres.');
        return;
      }
      if (/\d/.test(nombreLimpio)) {
        alert('⚠️ El nombre del cliente no debe contener números.');
        return;
      }
    }

    if (tipoDoc === 'Factura') {
      if (!/^\d{11}$/.test(docNum)) {
        alert('⚠️ El RUC debe tener exactamente 11 dígitos numéricos.');
        return;
      }
      if (!['10', '20', '15', '16', '17'].some(p => docNum.startsWith(p))) {
        alert('⚠️ El RUC debe comenzar con 10, 20, 15, 16 o 17 (según SUNAT).');
        return;
      }
      const razonSocial = (clienteNombre || '').trim();
      if (!razonSocial || razonSocial === 'PÚBLICO GENERAL') {
        alert('⚠️ Por favor ingresa la Razón Social de la empresa para la factura.');
        return;
      }
    }

    if (metodoPago === 'Efectivo' && pagaMonto < totalPagar) {
      alert(`⚠️ El monto pagado en efectivo (S/ ${pagaMonto.toFixed(2)}) es menor al total a pagar (S/ ${totalPagar.toFixed(2)}).`);
      return;
    }

    if (metodoPago === 'Mixto') {
      const ef = parseFloat(montoEfectivoMixto) || 0;
      const yp = parseFloat(montoYapeMixto) || 0;
      if (ef <= 0 && yp <= 0) {
        alert('⚠️ En pago Mixto debes ingresar los montos en Efectivo y Yape/Plin.');
        return;
      }
      if ((ef + yp) < totalPagar) {
        alert(`⚠️ La suma de Efectivo (S/ ${ef.toFixed(2)}) + Yape (S/ ${yp.toFixed(2)}) = S/ ${(ef + yp).toFixed(2)} no cubre el total a pagar de S/ ${totalPagar.toFixed(2)}.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const metodoFormateado = metodoPago === 'Mixto'
        ? `Mixto (Ef: S/ ${(parseFloat(montoEfectivoMixto) || 0).toFixed(2)} + Yp: S/ ${(parseFloat(montoYapeMixto) || 0).toFixed(2)})`
        : metodoPago;

      const payload = {
        tipo_comprobante: tipoDoc,
        doc_cliente: docNum,
        nombre_cliente: tipoDoc === 'Boleta Simple' ? 'PÚBLICO GENERAL' : clienteNombre,
        metodo_pago: metodoFormateado,
        monto_recibido: pagaMonto,
        vuelto: vuelto,
        descuento: montoDescuento,
        propina: montoPropina,
        total: totalPagar
      };

      const { data } = await axios.post(
        `${API}/api/caja/pedidos/${selectedCuenta.pedido_id}/cobrar`,
        payload,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      // Guardar ticket emitido para mostrar/imprimir
      setTicketEmitido({
        ...data.comprobante,
        descuento: montoDescuento,
        items: selectedCuenta.items,
        mesa: selectedCuenta.mesa,
        mesero: selectedCuenta.mesero
      });

      setSelectedCuenta(null);
      cargarCuentasBD();
      cargarHistorialBD();
    } catch (err) {
      if (err.response?.status === 409) {
        alert(`⚠️ ${err.response.data.message || 'Este pedido ya fue cobrado por otro cajero.'}`);
        setSelectedCuenta(null);
        cargarCuentasBD();
        cargarHistorialBD();
      } else {
        alert(err.response?.data?.error || 'Error al emitir el comprobante. Intenta nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const pendTotal = cuentas.reduce((acc, c) => acc + parseFloat(c.total), 0);
  const totalVendidoHistorial = historial.reduce((acc, h) => acc + parseFloat(h.total), 0);

  // Apertura de modal Z con selector de tipo de corte
  const abrirModalZ = async (tipo = 'MEDIO_DIA') => {
    try {
      const { data } = await axios.get(`${API}/api/caja/cierre-preview?tipo=${tipo}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setZStats(data);
      setTipoCierreModal(tipo);
      setObservacionesCierre('');
      setShowZReport(true);
    } catch (err) {
      alert('Error al calcular el pre-cierre.');
    }
  };

  const ejecutarCierreZ = async () => {
    if (!zStats || submitting) return;
    const mensajeConfirm = tipoCierreModal === 'FIN_DIA'
      ? '¿Estás seguro de FINALIZAR EL DÍA? Se consolidará la jornada completa.'
      : '¿Estás seguro de CERRAR CAJA MEDIO DÍA? Se registrará el arqueo del turno almuerzo.';
    if (!window.confirm(mensajeConfirm)) return;
    
    setSubmitting(true);
    try {
      await axios.post(`${API}/api/caja/cierre`, {
        ...zStats,
        tipo_cierre: tipoCierreModal,
        observaciones: observacionesCierre
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      // Mostrar ticket Z
      setTicketZEmitido({
        ...zStats,
        tipo_cierre: tipoCierreModal,
        observaciones: observacionesCierre,
        cajero: user.nombre,
        fecha: new Date().toLocaleString()
      });
      setShowZReport(false);
      cargarHistorialBD();
      cargarEstadoJornada();
      cargarCuentasBD();
    } catch (err) {
      alert('Error al ejecutar el cierre.');
    } finally {
      setSubmitting(false);
    }
  };

  // Cargar menú y abrir modal de Cambio de Plato Autorizado
  const cargarMenuParaCambio = async () => {
    try {
      const { data } = await axios.get(`${API}/api/menu`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMenuPlatosDisponibles(data);
    } catch (err) {
      console.error('Error cargando menú para cambio:', err);
    }
  };

  const abrirModalCambioPlato = (cuentaEspecifica = null) => {
    cargarMenuParaCambio();
    if (cuentaEspecifica) {
      const primerItem = cuentaEspecifica.items?.[0] || null;
      setCambioPlatoData({
        pedido_id: cuentaEspecifica.pedido_id,
        detalle_id: primerItem?.detalle_id || '',
        nuevo_producto_id: '',
        motivo: '',
        platoSeleccionadoObj: primerItem,
        modo: 'CAMBIAR'
      });
    } else {
      const primera = cuentas[0];
      const primerItem = primera?.items?.[0] || null;
      setCambioPlatoData({
        pedido_id: primera?.pedido_id || '',
        detalle_id: primerItem?.detalle_id || '',
        nuevo_producto_id: '',
        motivo: '',
        platoSeleccionadoObj: primerItem,
        modo: 'CAMBIAR'
      });
    }
    setShowCambioPlatoModal(true);
  };

  const handleConfirmarCambioPlato = async () => {
    if (!cambioPlatoData.pedido_id || !cambioPlatoData.detalle_id) {
      alert('⚠️ Selecciona la mesa y el plato.');
      return;
    }
    if (cambioPlatoData.modo !== 'CANCELAR' && !cambioPlatoData.nuevo_producto_id) {
      alert('⚠️ Selecciona el nuevo plato deseado.');
      return;
    }
    if (!cambioPlatoData.motivo || cambioPlatoData.motivo.trim().length < 4) {
      alert('⚠️ Ingresa un motivo claro (mínimo 4 caracteres).');
      return;
    }
    setSubmitting(true);
    try {
      if (cambioPlatoData.modo === 'CANCELAR') {
        const { data } = await axios.post(`${API}/api/admin/cancelar-plato-detalle`, {
          pedido_id: cambioPlatoData.pedido_id,
          detalle_id: cambioPlatoData.detalle_id,
          motivo: cambioPlatoData.motivo.trim()
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        alert(`✅ ${data.message}`);
      } else {
        const { data } = await axios.post(`${API}/api/admin/cambiar-plato`, {
          pedido_id: cambioPlatoData.pedido_id,
          detalle_id: cambioPlatoData.detalle_id,
          nuevo_producto_id: cambioPlatoData.nuevo_producto_id,
          motivo: cambioPlatoData.motivo.trim()
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        alert(`✅ ${data.message}\n${data.fue_merma ? '⚠️ Declarado como Merma en Cocina (plato ya en proceso).' : '📦 Insumos devueltos a almacén y Kardex (plato pendiente).'}`);
      }
      setShowCambioPlatoModal(false);
      cargarCuentasBD();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al procesar la operación.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cashier-view">
      {/* Encabezado de Caja */}
      <div className="view-header cashier-header">
        <div className="view-header__left">
          <h2 className="view-title">💰 Caja & Facturación — Don Bigote</h2>
          <p className="view-subtitle">Cajero responsable: {user.nombre}</p>
        </div>
        <div className="cashier-stats">
          <div className="cstat cstat--yellow">
            <span className="cstat__label">Por cobrar</span>
            <span className="cstat__num">S/ {pendTotal.toFixed(2)}</span>
          </div>
          <div className="cstat cstat--green">
            <span className="cstat__label">Total emitido hoy</span>
            <span className="cstat__num">S/ {totalVendidoHistorial.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Pestañas: Cuentas Abiertas vs Historial de Boletas & Botones de Operación */}
      <div className="filter-tabs" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className={`filter-tab ${tab === 'cuentas' ? 'active' : ''}`} onClick={() => setTab('cuentas')}>
            💳 Cuentas Abiertas ({cuentas.length})
          </button>
          <button className={`filter-tab ${tab === 'historial' ? 'active' : ''}`} onClick={() => setTab('historial')}>
            📜 Historial de Boletas Vendidas ({historial.length})
          </button>
          <button className={`filter-tab ${tab === 'propinas' ? 'active' : ''}`} onClick={() => { setTab('propinas'); cargarPropinasBD(); }}>
            💁 Liquidación de Propinas ({propinasData.meseros.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Botón de Cambio de Plato Autorizado */}
          <button
            className="btn-clear"
            style={{ padding: '8px 14px', fontSize: 13, borderColor: '#0284c7', color: '#0284c7', background: '#f0f9ff', fontWeight: 700 }}
            onClick={() => abrirModalCambioPlato()}
            disabled={cuentas.length === 0}
            title="Solo el Administrador o Supervisor de Caja puede autorizar cambios de plato"
          >
            🔄 Cambio de Plato Autorizado
          </button>

          {/* Cierre 1: Medio Día */}
          <button
            className="btn-send"
            style={{ width: 'auto', padding: '8px 16px', background: '#d97706', fontSize: 13, fontWeight: 700 }}
            onClick={() => abrirModalZ('MEDIO_DIA')}
          >
            ☀️ Cerrar Caja (Medio Día)
          </button>

          {/* Cierre 2: Finalizar Día Completo */}
          <button
            className="btn-send"
            style={{ width: 'auto', padding: '8px 16px', background: 'var(--navy-900)', fontSize: 13, fontWeight: 700 }}
            onClick={() => abrirModalZ('FIN_DIA')}
          >
            🌙 Finalizar Día
          </button>
        </div>
      </div>

      {/* ── BANNER 1: RESUMEN DE ARQUEOS DE MEDIO DÍA (NO BLOQUEA LA CAJA) ── */}
      {estadoJornada.medio_dia_cerrado && !cerrarBannerMedioDia && (
        <div style={{
          background: '#fefce8',
          border: '1px solid #fde047',
          borderRadius: 8,
          padding: '10px 16px',
          margin: '0 0 14px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 260 }}>
            <span style={{ fontSize: 18 }}>☀️</span>
            <div>
              <span style={{ fontWeight: 800, color: '#854d0e', fontSize: 13 }}>
                {estadoJornada.mi_medio_dia_cerrado
                  ? 'Arqueo de Medio Día efectuado para tu caja:'
                  : `Arqueo de Medio Día Registrado (${estadoJornada.ultimo_cierre_medio_dia?.cajero_nombre || 'Caja'}):`}
              </span>{' '}
              <span style={{ fontSize: 13, color: '#713f12' }}>
                Total cortado: <strong>S/ {parseFloat(estadoJornada.ultimo_cierre_medio_dia?.total_ventas || 0).toFixed(2)}</strong> ({estadoJornada.ultimo_cierre_medio_dia?.boletas_emitidas || 0} boletas).
                <span style={{ color: '#15803d', fontWeight: 700, marginLeft: 6 }}>
                  ✓ Tu caja continúa activa para atender y cobrar.
                </span>
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn-clear"
              style={{ padding: '4px 12px', fontSize: 12, background: '#ffffff', borderColor: '#eab308', color: '#a16207', fontWeight: 800 }}
              onClick={() => {
                setTicketZEmitido({
                  ...estadoJornada.ultimo_cierre_medio_dia,
                  tipo_cierre: 'MEDIO_DIA',
                  cajero: estadoJornada.ultimo_cierre_medio_dia?.cajero_nombre || 'Cajero',
                  fecha: new Date(estadoJornada.ultimo_cierre_medio_dia?.fecha_cierre).toLocaleString('es-PE')
                });
              }}
            >
              👁️ Ver Ticket Z
            </button>
            <button
              type="button"
              className="btn-clear"
              style={{ padding: '4px 8px', fontSize: 12, background: '#ffffff', borderColor: '#cbd5e1', color: '#64748b' }}
              onClick={() => setCerrarBannerMedioDia(true)}
              title="Ocultar aviso"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── BANNER 2: ALERTA DE FIN DE DÍA CERRADO (REAPERTURA INMEDIATA DISPONIBLE) ── */}
      {estadoJornada.ventas_bloqueadas && (
        <div style={{
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          border: '2px solid #ef4444',
          borderRadius: 10,
          padding: '14px 18px',
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
        }}>
          <div>
            <div style={{ fontWeight: 800, color: '#991b1b', fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>⛔</span> JORNADA DIARIA FINALIZADA — VENTAS Y COBROS BLOQUEADOS
            </div>
            <div style={{ fontSize: 13, color: '#7f1d1d', marginTop: 4 }}>
              ¿Se cerró el día por error? Puedes reabrir la jornada y reactivar las ventas inmediatamente para seguir cobrando hoy.
            </div>
          </div>
          <button
            className="btn-send"
            style={{ background: '#16a34a', width: 'auto', padding: '9px 20px', fontWeight: 800, fontSize: 13 }}
            onClick={reactivarVentasAdmin}
          >
            🔓 Reabrir Día / Reactivar Ventas
          </button>
        </div>
      )}

      {/* ── TAB 1: CUENTAS ABIERTAS ── */}
      {tab === 'cuentas' && (
        <div className="cashier-grid">
          {loading ? (
            <div className="kitch-empty"><p>Cargando cuentas desde MySQL...</p></div>
          ) : cuentas.length === 0 ? (
            <div className="kitch-empty">
              <span style={{ fontSize: 54 }}>💰</span>
              <p style={{ fontWeight: 700, fontSize: 16 }}>No hay cuentas pendientes de cobro</p>
              <small style={{ color: 'var(--text-muted)' }}>
                Las nuevas comandas enviadas por los meseros aparecerán aquí automáticamente.
              </small>
            </div>
          ) : cuentas.map((cuenta) => (
            <div key={cuenta.pedido_id} className="cuenta-card cuenta-card--pendiente">
              <div className="cuenta-top">
                <span className="cuenta-mesa">{cuenta.mesa}</span>
                <span className="cuenta-hora">🕐 {cuenta.hora}</span>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                👤 Atendido por: <strong style={{ color: 'var(--navy-900)' }}>{cuenta.mesero}</strong>
              </div>

              {/* Items del pedido */}
              <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 8, fontSize: 12 }}>
                {cuenta.items && cuenta.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                    <span>{item.cantidad}x {item.nombre}</span>
                    <strong style={{ color: 'var(--navy-900)' }}>S/ {parseFloat(item.subtotal || 0).toFixed(2)}</strong>
                  </div>
                ))}
              </div>

              <div className="cuenta-total">
                S/ {parseFloat(cuenta.total).toFixed(2)}
              </div>

              <button
                className="btn-cobrar"
                onClick={() => abrirModalCobro(cuenta)}
                disabled={estadoJornada.ventas_bloqueadas}
                style={{
                  opacity: estadoJornada.ventas_bloqueadas ? 0.5 : 1,
                  cursor: estadoJornada.ventas_bloqueadas ? 'not-allowed' : 'pointer'
                }}
                title={estadoJornada.ventas_bloqueadas ? 'Ventas bloqueadas por Fin de Día' : 'Cobrar cuenta'}
              >
                {estadoJornada.ventas_bloqueadas ? '🔒 Ventas Bloqueadas' : '💳 Cobrar & Emitir Boleta'}
              </button>
              <button
                className="btn-clear"
                style={{ marginTop: 8, width: '100%', fontSize: 13, border: '1px solid #cbd5e1' }}
                onClick={() => setPreCuentaEmitida(cuenta)}
              >
                🧾 Imprimir Pre-Cuenta
              </button>
              <button
                className="btn-clear"
                style={{ marginTop: 6, width: '100%', fontSize: 12, border: '1px solid #bae6fd', color: '#0284c7', background: '#f0f9ff', fontWeight: 700 }}
                onClick={() => abrirModalCambioPlato(cuenta)}
              >
                🔄 Cambiar Plato Autorizado
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 2: HISTORIAL DE BOLETAS VENDIDAS ── */}
      {tab === 'historial' && (
        <div className="admin-content">
          <div className="users-table-wrap">
            {historial.length === 0 ? (
              <p style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
                Aún no se han emitido boletas el día de hoy.
              </p>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>N° Comprobante</th>
                    <th>Tipo</th>
                    <th>Cliente / Doc</th>
                    <th>Mesero / Mesa</th>
                    <th>Método Pago</th>
                    <th>Hora</th>
                    <th>Total</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((h) => (
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
                      <td>{h.hora} ({h.fecha})</td>
                      <td style={{ fontWeight: 800, fontSize: 15, color: 'var(--cyan-500)' }}>
                        S/ {parseFloat(h.total).toFixed(2)}
                      </td>
                      <td>
                        <button
                          className="btn-clear"
                          style={{ padding: '4px 10px', fontSize: 11 }}
                          onClick={() => setTicketEmitido(h)}
                        >
                          🖨️ Ver Ticket
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

      {/* ── TAB 3: LIQUIDACIÓN DE PROPINAS DE MESEROS ── */}
      {tab === 'propinas' && (
        <div className="admin-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--navy-900)' }}>💁 Liquidación & Arqueo Diario de Propinas</h3>
              <small style={{ color: 'var(--text-muted)' }}>Control exacto de propinas voluntarias recaudadas en comprobantes por cada mesero</small>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="date"
                className="pos-search-input"
                style={{ width: 160, padding: '6px 10px' }}
                value={fechaPropinas}
                onChange={(e) => {
                  setFechaPropinas(e.target.value);
                  cargarPropinasBD(e.target.value);
                }}
              />
              <button 
                className="btn-clear" 
                style={{ padding: '6px 12px', fontSize: 13 }}
                onClick={() => cargarPropinasBD(fechaPropinas)}
              >
                🔄 Actualizar
              </button>
            </div>
          </div>

          {/* Tarjetas de Resumen */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 18 }}>
            <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '1px solid #6ee7b7', padding: 16, borderRadius: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#065f46' }}>TOTAL PROPINAS A REPARTIR</span>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#047857', marginTop: 4 }}>
                S/ {Number(propinasData.total_general || 0).toFixed(2)}
              </div>
              <small style={{ color: '#059669' }}>Recaudado voluntariamente por clientes</small>
            </div>
            <div className="kpi-card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 16, borderRadius: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>MESEROS RECONOCIDOS</span>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', marginTop: 4 }}>
                {propinasData.meseros.length}
              </div>
              <small style={{ color: '#64748b' }}>Con al menos 1 propina hoy</small>
            </div>
          </div>

          {/* Tabla de liquidación por mesero */}
          <div className="users-table-wrap">
            {loadingPropinas ? (
              <p style={{ padding: 20, textAlign: 'center' }}>Cargando liquidación de propinas...</p>
            ) : propinasData.meseros.length === 0 ? (
              <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: 40 }}>🤲</span>
                <p style={{ fontWeight: 700, marginTop: 8 }}>No se han registrado propinas voluntarias en esta fecha.</p>
                <small>Al cobrar un pedido, ingresa la propina voluntaria otorgada por el cliente.</small>
              </div>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Mesero</th>
                    <th>N° Atenciones c/ Propina</th>
                    <th>Ventas Totales Atendidas</th>
                    <th>Total Propina Recaudada</th>
                    <th>% Propina Efectiva</th>
                    <th>Estado de Liquidación</th>
                  </tr>
                </thead>
                <tbody>
                  {propinasData.meseros.map((m) => {
                    const totalVentas = Number(m.total_ventas_atendidas || 0);
                    const totalProp = Number(m.total_propinas || 0);
                    const pct = totalVentas > 0 ? ((totalProp / totalVentas) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={m.mesero_id}>
                        <td style={{ fontWeight: 800, color: 'var(--navy-900)' }}>
                          👤 {m.mesero_nombre}
                        </td>
                        <td>
                          <span className="role-badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                            {m.cantidad_atenciones} pedidos
                          </span>
                        </td>
                        <td>S/ {totalVentas.toFixed(2)}</td>
                        <td style={{ fontWeight: 900, fontSize: 15, color: '#16a34a' }}>
                          S/ {totalProp.toFixed(2)}
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: '#c2410c' }}>{pct}%</span>
                        </td>
                        <td>
                          <span className="status-dot active">● Listo p/ entrega en efectivo</span>
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
         MODAL DE COBRO Y SELECCIÓN DE MÉTODO DE PAGO
         ═══════════════════════════════════════════════════════════ */}
      {selectedCuenta && (
        <div className="pos-modal-overlay" style={{ alignItems: 'center', overflowY: 'auto' }}>
          <div className="pos-modal-card" style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column', width: 540, maxWidth: '96vw' }}>
            <div className="pos-modal-header" style={{ flexShrink: 0 }}>
              <h3>💳 Cobrar & Emitir Comprobante — {selectedCuenta.mesa}</h3>
              <button className="modal-close-btn" onClick={() => setSelectedCuenta(null)}>✕</button>
            </div>

            <div className="pos-modal-body" style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>

              {/* 1. Selección de Tipo de Comprobante */}
              <div className="modal-section">
                <label className="modal-label">1. Tipo de Comprobante</label>
                <div className="filter-tabs" style={{ marginTop: 4 }}>
                  {['Boleta Simple', 'Boleta con DNI', 'Factura'].map((tipo) => (
                    <button
                      key={tipo}
                      className={`filter-tab ${tipoDoc === tipo ? 'active' : ''}`}
                      onClick={() => cambiarTipoDoc(tipo)}
                    >
                      {tipo === 'Boleta Simple' ? '📄 Boleta Simple' : tipo === 'Boleta con DNI' ? '🆔 Boleta c/ DNI' : '🏢 Factura (RUC)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Campos para DNI (8 dígitos) / Factura (11 dígitos) con búsqueda automática y validaciones estrictas */}
              {tipoDoc !== 'Boleta Simple' && (
                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, marginBottom: 14, border: '1px solid #e2e8f0' }}>
                  <div className="modal-section-grid">
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="modal-label" style={{ marginBottom: 4 }}>
                          {tipoDoc === 'Factura' ? 'RUC (11 dígitos)' : 'DNI (8 dígitos)'}
                        </label>
                        <span style={{ fontSize: 11, fontWeight: 700, color: esDocCompleto ? '#16a34a' : 'var(--text-muted)' }}>
                          {docNum.length} / {lenRequerida}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          type="text"
                          className="modal-input"
                          maxLength={lenRequerida}
                          placeholder={tipoDoc === 'Factura' ? 'Ej. 20601234567' : 'Ej. 72839401'}
                          value={docNum}
                          onChange={(e) => handleCambioDoc(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); buscarDocManual(docNum); } }}
                          style={{
                            fontWeight: 700,
                            borderColor: clienteVerificado ? '#16a34a' : clienteNuevo ? '#ea580c' : undefined
                          }}
                        />
                        <button
                          type="button"
                          className="btn-send"
                          style={{ width: 'auto', padding: '0 12px', fontSize: 13, background: '#0284c7' }}
                          onClick={() => buscarDocManual(docNum)}
                          disabled={docNum.length < lenRequerida || buscandoCliente}
                          title="Buscar documento"
                        >
                          {buscandoCliente ? '...' : '🔍'}
                        </button>
                      </div>
                      {buscandoCliente && (
                        <div style={{ color: '#0284c7', fontSize: 12, marginTop: 4, fontWeight: 600 }}>
                          🔍 Buscando en base de datos...
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="modal-label" style={{ marginBottom: 4 }}>
                          {tipoDoc === 'Factura' ? 'Razón Social' : 'Nombre Completo del Cliente'}
                        </label>
                        {clienteVerificado && (
                          <span style={{ color: '#16a34a', fontSize: 11, fontWeight: 700 }}>🔒 Verificado</span>
                        )}
                        {clienteNuevo && (
                          <span style={{ color: '#ea580c', fontSize: 11, fontWeight: 700 }}>🆕 Nuevo</span>
                        )}
                      </div>
                      <input
                        type="text"
                        className="modal-input"
                        placeholder={!esDocCompleto ? (tipoDoc === 'Factura' ? 'Ingresa los 11 dígitos del RUC...' : 'Ingresa los 8 dígitos del DNI...') : (tipoDoc === 'Factura' ? 'Ej. Inversiones Marinas S.A.C.' : 'Ej. Juan Carlos Mendoza Silva')}
                        value={clienteNombre}
                        onChange={(e) => setClienteNombre(e.target.value)}
                        readOnly={clienteVerificado}
                        disabled={!esDocCompleto}
                        style={{
                          fontWeight: 600,
                          background: clienteVerificado ? '#f1f5f9' : '#fff',
                          cursor: clienteVerificado ? 'not-allowed' : 'text'
                        }}
                      />
                    </div>
                  </div>

                  {/* Avisos de estado de validación instantánea */}
                  {clienteVerificado && (
                    <div style={{ marginTop: 8, padding: '8px 12px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: 6, fontSize: 12, color: '#166534', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>✅ <strong>Cliente registrado:</strong> {clienteAutocompletado.nombre}</span>
                      <span style={{ background: '#16a34a', color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                        {cantVisitas} {cantVisitas === 1 ? 'visita' : 'visitas'}
                      </span>
                    </div>
                  )}

                  {/* Banner Promoción 20% por 5 visitas */}
                  {tienePromo5Visitas && (
                    <div style={{
                      marginTop: 10,
                      padding: '12px 14px',
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      border: '2px solid #f59e0b',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)'
                    }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#92400e', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>🎉</span> ¡PROMOCIÓN 5 VISITAS ACTIVADA!
                        </div>
                        <div style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>
                          Cliente con <strong>{cantVisitas} visitas</strong>. Recibe <strong>20% de descuento</strong> (Ahorro: S/ {montoDescuento.toFixed(2)}).
                        </div>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 12, color: '#78350f', cursor: 'pointer', background: '#fff', padding: '6px 10px', borderRadius: 6, border: '1px solid #f59e0b' }}>
                        <input
                          type="checkbox"
                          checked={descuentoFidelidad}
                          onChange={(e) => {
                            const activo = e.target.checked;
                            setDescuentoFidelidad(activo);
                            const nuevoTotal = activo ? (subtotalBase * 0.80) : subtotalBase;
                            setMontoPaga(nuevoTotal.toFixed(2));
                          }}
                          style={{ width: 16, height: 16, accentColor: '#d97706', cursor: 'pointer' }}
                        />
                        Aplicar 20%
                      </label>
                    </div>
                  )}

                  {/* Progreso hacia las 5 visitas si aún tiene menos de 5 */}
                  {clienteVerificado && cantVisitas < 5 && (
                    <div style={{ marginTop: 8, padding: '6px 12px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 6, fontSize: 12, color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>⭐ Progreso fidelidad: <strong>{cantVisitas} de 5 visitas</strong></span>
                      <span style={{ color: '#0284c7', fontWeight: 600 }}>
                        {5 - cantVisitas === 1 ? '¡Le falta solo 1 visita para obtener 20% de descuento!' : `Le faltan ${5 - cantVisitas} visitas para el 20% de descuento`}
                      </span>
                    </div>
                  )}

                  {clienteNuevo && (
                    <div style={{ marginTop: 8, padding: '10px 12px', background: '#ffedd5', border: '1px solid #fdba74', borderRadius: 8, fontSize: 12, color: '#9a3412', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        ✨ <strong>Cliente nuevo detectado:</strong> Ingresa el nombre arriba.
                      </div>
                      <button
                        type="button"
                        className="btn-send"
                        style={{ width: 'auto', padding: '5px 14px', fontSize: 12, background: '#ea580c', fontWeight: 700 }}
                        onClick={handleGuardarClienteRapido}
                        disabled={guardandoCliente || !clienteNombre.trim() || clienteNombre.trim().length < 3}
                      >
                        {guardandoCliente ? 'Guardando...' : '💾 Registrar Cliente en BD'}
                      </button>
                    </div>
                  )}

                  {docNum.length > 0 && !esDocCompleto && (
                    <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                      ℹ️ Faltan {lenRequerida - docNum.length} dígitos para completar la búsqueda automática.
                    </div>
                  )}
                </div>
              )}

              {/* 2. Método de Pago (Efectivo, Yape/Plin, o Pago Mixto) */}
              <div className="modal-section">
                <label className="modal-label">2. Forma de Pago</label>
                <div className="filter-tabs" style={{ marginTop: 4 }}>
                  {[
                    ['Efectivo', '💵 Efectivo'],
                    ['Yape',     '📱 Yape / Plin'],
                    ['Mixto',    '⚖️ Mixto (Efectivo + Yape)']
                  ].map(([mKey, mLabel]) => (
                    <button
                      key={mKey}
                      className={`filter-tab ${metodoPago === mKey ? 'active' : ''}`}
                      onClick={() => {
                        setMetodoPago(mKey);
                        if (mKey === 'Mixto') {
                          // Sugerir mitad y mitad o efectivo base
                          const mitad = (totalPagar / 2).toFixed(2);
                          setMontoEfectivoMixto(mitad);
                          setMontoYapeMixto((totalPagar - parseFloat(mitad)).toFixed(2));
                        }
                      }}
                    >
                      {mLabel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cálculo de vuelto si es Efectivo Simple */}
              {metodoPago === 'Efectivo' && (
                <div className="modal-cash-box">
                  <div style={{ flex: 1 }}>
                    <label className="modal-label">Monto recibido (S/)</label>
                    <input
                      type="number"
                      step="0.10"
                      className="modal-input"
                      style={{ fontSize: 18, fontWeight: 800 }}
                      value={montoPaga}
                      onChange={(e) => setMontoPaga(e.target.value)}
                    />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="modal-label">Vuelto a entregar</span>
                    <div style={{ fontSize: 24, fontWeight: 800, color: vuelto > 0 ? '#16a34a' : 'var(--text-main)' }}>
                      S/ {vuelto.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* Campos divididos para Pago Mixto (Efectivo + Yape) */}
              {metodoPago === 'Mixto' && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#166534', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>⚖️ Pago Combinado: Efectivo + Yape / Plin</span>
                    <span style={{ fontSize: 11, color: '#047857' }}>Total a cubrir: S/ {totalPagar.toFixed(2)}</span>
                  </div>
                  <div className="modal-section-grid">
                    <div>
                      <label className="modal-label" style={{ marginBottom: 4 }}>💵 Monto en Efectivo (S/)</label>
                      <input
                        type="number"
                        step="0.50"
                        className="modal-input"
                        placeholder="0.00"
                        style={{ fontWeight: 800, fontSize: 16 }}
                        value={montoEfectivoMixto}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMontoEfectivoMixto(val);
                          const num = parseFloat(val) || 0;
                          const rest = Math.max(0, totalPagar - num);
                          setMontoYapeMixto(rest.toFixed(2));
                        }}
                      />
                    </div>
                    <div>
                      <label className="modal-label" style={{ marginBottom: 4 }}>📱 Monto en Yape / Plin (S/)</label>
                      <input
                        type="number"
                        step="0.50"
                        className="modal-input"
                        placeholder="0.00"
                        style={{ fontWeight: 800, fontSize: 16 }}
                        value={montoYapeMixto}
                        onChange={(e) => setMontoYapeMixto(e.target.value)}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, paddingTop: 6, borderTop: '1px dashed #bbf7d0' }}>
                    <span>Suma ingresada: <strong>S/ {pagaMonto.toFixed(2)}</strong></span>
                    <span style={{ fontWeight: 700, color: vuelto > 0 ? '#16a34a' : pagaMonto < totalPagar ? '#dc2626' : '#166534' }}>
                      {pagaMonto < totalPagar ? `Falta S/ ${(totalPagar - pagaMonto).toFixed(2)}` : vuelto > 0 ? `Vuelto efectivo: S/ ${vuelto.toFixed(2)}` : 'Exacto ✅'}
                    </span>
                  </div>
                </div>
              )}

              {/* 3. Propina Voluntaria para el Mesero */}
              <div className="modal-section" style={{ marginTop: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="modal-label">3. Propina Voluntaria para el Mesero</label>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
                    {montoPropina > 0 ? `+ S/ ${montoPropina.toFixed(2)}` : 'Sin propina'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  {[
                    [0, 'S/ 0'],
                    [2, 'S/ 2'],
                    [5, 'S/ 5'],
                    [10, 'S/ 10'],
                    [(subtotalBase * 0.05), '5%'],
                    [(subtotalBase * 0.10), '10%']
                  ].map(([pVal, pLabel], idx) => {
                    const rounded = Math.round(pVal * 10) / 10;
                    const isActive = Math.abs(montoPropina - rounded) < 0.05 && (rounded > 0 || montoPropina === 0);
                    return (
                      <button
                        key={idx}
                        type="button"
                        className={`filter-tab ${isActive ? 'active' : ''}`}
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => {
                          setPropina(rounded);
                          if (metodoPago === 'Efectivo') {
                            setMontoPaga(((subtotalBase - montoDescuento) + rounded).toFixed(2));
                          }
                        }}
                      >
                        {pLabel} {pVal > 0 && !pLabel.startsWith('S/') ? `(S/ ${rounded.toFixed(1)})` : ''}
                      </button>
                    );
                  })}
                  <input
                    type="number"
                    step="0.50"
                    placeholder="Otro S/"
                    style={{ width: 85, padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 700 }}
                    value={propina || ''}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setPropina(v);
                      if (metodoPago === 'Efectivo') {
                        setMontoPaga(((subtotalBase - montoDescuento) + v).toFixed(2));
                      }
                    }}
                  />
                </div>
              </div>

              {/* Resumen Total y Descuento */}
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, margin: '12px 0 6px 0', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
                  <span>Subtotal consumo:</span>
                  <span>S/ {subtotalBase.toFixed(2)}</span>
                </div>
                {montoDescuento > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#b45309', fontWeight: 800, marginTop: 4 }}>
                    <span>🎁 Descuento Fidelidad (20% por 5 Visitas):</span>
                    <span>- S/ {montoDescuento.toFixed(2)}</span>
                  </div>
                )}
                {montoPropina > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#16a34a', fontWeight: 800, marginTop: 4 }}>
                    <span>💁 Propina Mesero ({selectedCuenta.mesero}):</span>
                    <span>+ S/ {montoPropina.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="modal-total-bar">
                <span>TOTAL A COBRAR:</span>
                <span className="mtb-total">S/ {totalPagar.toFixed(2)}</span>
              </div>

            </div>

            <div className="pos-modal-footer" style={{ flexShrink: 0, padding: '12px 20px', background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
              <button className="btn-clear" onClick={() => setSelectedCuenta(null)}>Cancelar</button>
              <button
                className="btn-send"
                style={{ width: 'auto', padding: '10px 24px', background: '#16a34a', fontWeight: 800 }}
                onClick={handleConfirmarCobro}
                disabled={submitting}
              >
                {submitting ? 'Procesando...' : '✅ Emitir Boleta y Cerrar Cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
         MODAL / VISTA DE TICKET DE VENTA IMPRIMIBLE (80mm)
         ═══════════════════════════════════════════════════════════ */}
      {ticketEmitido && (
        <div className="pos-modal-overlay">
          <div className="ticket-card-wrap">
            <div id="printable-ticket" className="ticket-80mm">
              <div className="ticket-header">
                <img src="/logo.jpg" alt="Don Bigote Logo" style={{ width: 48, height: 48, borderRadius: '50%' }} />
                <h2 className="ticket-brand">LA SAZÓN DE DON BIGOTE</h2>
                <p>Cebichería & Restaurante Marino</p>
                <p>RUC: 20601234567</p>
                <div className="ticket-divider" />
                <h3 className="ticket-correlativo">{ticketEmitido.tipo_comprobante || 'BOLETA DE VENTA'}</h3>
                <h4 className="ticket-num">{ticketEmitido.correlativo || ticketEmitido.serie_correlativo}</h4>
              </div>

              <div className="ticket-info">
                <div><span>Fecha/Hora:</span> <span>{ticketEmitido.fecha_emision ? new Date(ticketEmitido.fecha_emision).toLocaleString('es-PE') : ticketEmitido.fecha + ' ' + ticketEmitido.hora}</span></div>
                <div><span>Cliente:</span> <span>{ticketEmitido.nombre_cliente}</span></div>
                {ticketEmitido.doc_cliente && <div><span>Doc:</span> <span>{ticketEmitido.doc_cliente}</span></div>}
                <div><span>Mesa / Atend:</span> <span>{ticketEmitido.mesa || 'Mesa'} - {ticketEmitido.mesero}</span></div>
                <div><span>Forma Pago:</span> <span style={{ fontWeight: 800 }}>{ticketEmitido.metodo_pago}</span></div>
              </div>

              <div className="ticket-divider" />

              <table className="ticket-items">
                <thead>
                  <tr>
                    <th>Cant</th>
                    <th>Descripción</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketEmitido.items && ticketEmitido.items.map((it, i) => (
                    <tr key={i}>
                      <td>{it.cantidad}</td>
                      <td>{it.nombre}</td>
                      <td style={{ textAlign: 'right' }}>S/ {parseFloat(it.subtotal || (it.cantidad * it.precio)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="ticket-divider" />

              <div className="ticket-totals">
                <div><span>Op. Gravada:</span> <span>S/ {(parseFloat(ticketEmitido.total) * 0.82).toFixed(2)}</span></div>
                <div><span>IGV (18%):</span> <span>S/ {(parseFloat(ticketEmitido.total) * 0.18).toFixed(2)}</span></div>
                {parseFloat(ticketEmitido.descuento || 0) > 0 && (
                  <div style={{ color: '#b45309', fontWeight: 800 }}>
                    <span>Desc. 20% (Fidelidad 5 Visitas):</span>
                    <span>- S/ {parseFloat(ticketEmitido.descuento).toFixed(2)}</span>
                  </div>
                )}
                {parseFloat(ticketEmitido.propina || 0) > 0 && (
                  <div style={{ color: '#16a34a', fontWeight: 800 }}>
                    <span>Propina Voluntaria Mesero:</span>
                    <span>+ S/ {parseFloat(ticketEmitido.propina).toFixed(2)}</span>
                  </div>
                )}
                <div className="ticket-grand-total"><span>TOTAL:</span> <span>S/ {parseFloat(ticketEmitido.total).toFixed(2)}</span></div>
                {ticketEmitido.metodo_pago?.includes('Efectivo') && (
                  <>
                    <div><span>Recibido:</span> <span>S/ {parseFloat(ticketEmitido.monto_recibido || ticketEmitido.total).toFixed(2)}</span></div>
                    <div><span>Vuelto:</span> <span>S/ {parseFloat(ticketEmitido.vuelto || 0).toFixed(2)}</span></div>
                  </>
                )}
              </div>

              <div className="ticket-footer">
                <p>¡Gracias por su preferencia!</p>
                <p>Don Bigote les desea buen provecho 🐟</p>
              </div>
            </div>

            <div className="ticket-actions">
              <button className="btn-send" style={{ flex: 1 }} onClick={() => window.print()}>
                🖨️ Imprimir Ticket (80mm)
              </button>
              <button className="btn-clear" onClick={() => setTicketEmitido(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW CIERRE Z (MEDIO DÍA VS FIN DE DÍA) */}
      {showZReport && zStats && (
        <div className="pos-modal-overlay">
          <div className="pos-modal" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 28 }}>{tipoCierreModal === 'FIN_DIA' ? '🌙' : '☀️'}</span>
              <div>
                <h2 style={{ margin: 0, color: 'var(--navy-900)', fontSize: 18 }}>
                  {tipoCierreModal === 'FIN_DIA' ? 'Reporte Z — Finalizar Día (Fin de Jornada)' : 'Cierre de Caja — Turno Medio Día'}
                </h2>
                <small style={{ color: 'var(--text-muted)' }}>
                  {tipoCierreModal === 'FIN_DIA'
                    ? 'Consolidado general de toda la jornada de hoy. Cierre total de operaciones.'
                    : 'Corte de caja de almuerzo. Arqueo del primer turno.'}
                </small>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, margin: '14px 0', display: 'flex', flexDirection: 'column', gap: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>Total Boletas Emitidas:</span>
                <span style={{ fontWeight: 800 }}>{zStats.boletas_emitidas}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontSize: 14 }}>
                <span style={{ fontWeight: 600 }}>💵 Efectivo en Caja:</span>
                <span style={{ fontWeight: 800 }}>S/ {parseFloat(zStats.monto_efectivo || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a855f7', fontSize: 14 }}>
                <span style={{ fontWeight: 600 }}>📱 Yape / Plin:</span>
                <span style={{ fontWeight: 800 }}>S/ {parseFloat(zStats.monto_yape || 0).toFixed(2)}</span>
              </div>
              {parseFloat(zStats.total_descuentos || 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b45309', fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>🎁 Descuentos Promocionales:</span>
                  <span style={{ fontWeight: 800 }}>- S/ {parseFloat(zStats.total_descuentos || 0).toFixed(2)}</span>
                </div>
              )}
              <div style={{ borderTop: '2px dashed #cbd5e1', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, color: 'var(--navy-900)' }}>
                <span style={{ fontWeight: 800 }}>TOTAL FACTURADO:</span>
                <span style={{ fontWeight: 900 }}>S/ {parseFloat(zStats.total_ventas || 0).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="modal-label" style={{ marginBottom: 4 }}>
                Observaciones / Arqueo Físico de Efectivo:
              </label>
              <textarea
                className="modal-input"
                rows={2}
                placeholder="Ej. Cuadre exacto en caja chica, billetes de 50 y 20 separados..."
                value={observacionesCierre}
                onChange={(e) => setObservacionesCierre(e.target.value)}
                style={{ resize: 'none', fontSize: 12 }}
              />
            </div>

            <div className="pos-modal-footer">
              <button className="btn-clear" onClick={() => setShowZReport(false)}>Cancelar</button>
              <button
                className="btn-send"
                style={{ background: tipoCierreModal === 'FIN_DIA' ? 'var(--navy-900)' : '#d97706' }}
                onClick={ejecutarCierreZ}
                disabled={submitting}
              >
                {submitting ? 'Guardando Cierre...' : (tipoCierreModal === 'FIN_DIA' ? '🌙 Confirmar y Finalizar Día' : '☀️ Confirmar Cierre Medio Día')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TICKET Z IMPRIMIBLE (80MM TÉRMICO) */}
      {ticketZEmitido && (
        <div className="pos-modal-overlay">
          <div className="ticket-card-wrap">
            <div id="printable-ticket" className="ticket-80mm">
              <div className="ticket-header">
                <img src="/logo.jpg" alt="Don Bigote Logo" style={{ width: 44, height: 44, borderRadius: '50%' }} />
                <h2 className="ticket-brand">LA SAZÓN DE DON BIGOTE</h2>
                <h3 className="ticket-correlativo">
                  {ticketZEmitido.tipo_cierre === 'FIN_DIA' ? 'REPORTE Z — CIERRE TOTAL DEL DÍA' : 'CORTE DE MEDIO DÍA — ARQUEO DE CAJA'}
                </h3>
              </div>
              
              <div className="ticket-info">
                <div><span>Fecha / Hora:</span> <span>{ticketZEmitido.fecha}</span></div>
                <div><span>Cajero Responsable:</span> <span>{ticketZEmitido.cajero}</span></div>
                <div><span>Tipo de Cierre:</span> <span style={{ fontWeight: 800 }}>{ticketZEmitido.tipo_cierre === 'FIN_DIA' ? 'FINAL DE JORNADA' : 'MEDIO DÍA (ALMUERZO)'}</span></div>
              </div>
              
              <div className="ticket-divider" />
              <h4 style={{ textAlign: 'center', margin: '4px 0', fontSize: 12 }}>RESUMEN DE RECAUDACIÓN</h4>
              <div className="ticket-divider" />
              
              <div className="ticket-totals" style={{ marginTop: 8 }}>
                <div><span>Boletas Emitidas:</span> <span>{ticketZEmitido.boletas_emitidas}</span></div>
                <div><span>💵 Efectivo en Caja:</span> <span>S/ {parseFloat(ticketZEmitido.monto_efectivo || 0).toFixed(2)}</span></div>
                <div><span>📱 Yape / Plin:</span> <span>S/ {parseFloat(ticketZEmitido.monto_yape || 0).toFixed(2)}</span></div>
                {parseFloat(ticketZEmitido.total_descuentos || 0) > 0 && (
                  <div><span>🎁 Descuentos Promocionales:</span> <span>- S/ {parseFloat(ticketZEmitido.total_descuentos || 0).toFixed(2)}</span></div>
                )}
                <div className="ticket-grand-total" style={{ marginTop: 8, paddingTop: 8, borderTop: '2px dashed #000' }}>
                  <span>TOTAL FACTURADO:</span> <span>S/ {parseFloat(ticketZEmitido.total_ventas || 0).toFixed(2)}</span>
                </div>
              </div>

              {ticketZEmitido.observaciones && (
                <div style={{ marginTop: 10, fontSize: 11, fontStyle: 'italic', background: '#f1f5f9', padding: 6, borderRadius: 4 }}>
                  <strong>Notas:</strong> {ticketZEmitido.observaciones}
                </div>
              )}
              
              <div className="ticket-footer" style={{ marginTop: 24 }}>
                <p>--- FIN DEL DOCUMENTO ---</p>
                <div style={{ marginTop: 20 }}>
                  <p>Firma Cajero: ______________________</p>
                  <p>V°B° Administrador: ________________</p>
                </div>
              </div>
            </div>
            <div className="ticket-actions">
              <button className="btn-send" style={{ flex: 1 }} onClick={() => window.print()}>
                🖨️ Imprimir Cierre ({ticketZEmitido.tipo_cierre === 'FIN_DIA' ? 'Fin Día' : 'Medio Día'})
              </button>
              <button className="btn-clear" onClick={() => setTicketZEmitido(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
         MODAL: CAMBIO DE PLATO AUTORIZADO (SOLO ADMIN / CAJERO)
         ═══════════════════════════════════════════════════════════ */}
      {showCambioPlatoModal && (
        <div className="pos-modal-overlay">
          <div className="pos-modal-card" style={{ maxWidth: 520 }}>
            <div className="pos-modal-header">
              <h3>🔄 Cambio de Plato Autorizado — Supervisión de Caja</h3>
              <button className="modal-close-btn" onClick={() => setShowCambioPlatoModal(false)}>✕</button>
            </div>

            <div className="pos-modal-body">
              {/* Selector de Modo */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <button
                  type="button"
                  className={`filter-tab ${cambioPlatoData.modo !== 'CANCELAR' ? 'active' : ''}`}
                  style={{ flex: 1, padding: '8px 12px', fontSize: 13, fontWeight: 700 }}
                  onClick={() => setCambioPlatoData({ ...cambioPlatoData, modo: 'CAMBIAR' })}
                >
                  🔄 Reemplazar por otro Plato
                </button>
                <button
                  type="button"
                  className={`filter-tab ${cambioPlatoData.modo === 'CANCELAR' ? 'active' : ''}`}
                  style={{ flex: 1, padding: '8px 12px', fontSize: 13, fontWeight: 700, borderColor: cambioPlatoData.modo === 'CANCELAR' ? '#ef4444' : undefined, background: cambioPlatoData.modo === 'CANCELAR' ? '#fee2e2' : undefined, color: cambioPlatoData.modo === 'CANCELAR' ? '#b91c1c' : undefined }}
                  onClick={() => setCambioPlatoData({ ...cambioPlatoData, modo: 'CANCELAR' })}
                >
                  ❌ Anular / Cancelar Plato
                </button>
              </div>

              <div style={{ background: '#f0f9ff', padding: '10px 14px', borderRadius: 8, marginBottom: 14, border: '1px solid #bae6fd', fontSize: 12, color: '#0369a1' }}>
                ℹ️ <strong>Control de Kardex:</strong> Si el plato está en estado 'Pendiente', sus insumos regresan inmediatamente al almacén y se asientan en el Kardex como <em>ENTRADA_DEVOLUCION</em>. Si ya estaba en cocina, se declara como merma.
              </div>

              {/* 1. Seleccionar Mesa / Cuenta */}
              <div className="modal-section">
                <label className="modal-label">1. Selecciona la Mesa Abierta</label>
                <select
                  className="modal-input"
                  value={cambioPlatoData.pedido_id}
                  onChange={(e) => {
                    const pedId = Number(e.target.value);
                    const cuentaElegida = cuentas.find(c => c.pedido_id === pedId);
                    const primerItem = cuentaElegida?.items?.[0] || null;
                    setCambioPlatoData({
                      ...cambioPlatoData,
                      pedido_id: pedId,
                      detalle_id: primerItem?.detalle_id || '',
                      platoSeleccionadoObj: primerItem
                    });
                  }}
                >
                  <option value="">-- Selecciona una mesa --</option>
                  {cuentas.map(c => (
                    <option key={c.pedido_id} value={c.pedido_id}>
                      {c.mesa} — Atiende: {c.mesero} (Total actual: S/ {parseFloat(c.total).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Seleccionar Plato de la Mesa a Reemplazar o Cancelar */}
              {cambioPlatoData.pedido_id && (
                <div className="modal-section" style={{ marginTop: 12 }}>
                  <label className="modal-label">2. Plato Actual a {cambioPlatoData.modo === 'CANCELAR' ? 'Anular / Cancelar' : 'Reemplazar'}</label>
                  {(() => {
                    const cuentaActual = cuentas.find(c => c.pedido_id === Number(cambioPlatoData.pedido_id));
                    const items = cuentaActual?.items || [];
                    return (
                      <select
                        className="modal-input"
                        value={cambioPlatoData.detalle_id}
                        onChange={(e) => {
                          const detId = Number(e.target.value);
                          const it = items.find(i => i.detalle_id === detId);
                          setCambioPlatoData({
                            ...cambioPlatoData,
                            detalle_id: detId,
                            platoSeleccionadoObj: it
                          });
                        }}
                      >
                        <option value="">-- Selecciona el plato --</option>
                        {items.map(it => (
                          <option key={it.detalle_id} value={it.detalle_id}>
                            {it.cantidad}x {it.nombre} (S/ {parseFloat(it.precio || 0).toFixed(2)} c/u) — Estado Cocina: {it.estado_cocina || 'Pendiente'}
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </div>
              )}

              {/* Advertencia del Estado en Cocina */}
              {cambioPlatoData.platoSeleccionadoObj && (
                <div style={{
                  marginTop: 10,
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  background: cambioPlatoData.platoSeleccionadoObj.estado_cocina === 'Pendiente' ? '#dcfce7' : '#ffedd5',
                  border: `1px solid ${cambioPlatoData.platoSeleccionadoObj.estado_cocina === 'Pendiente' ? '#86efac' : '#fdba74'}`,
                  color: cambioPlatoData.platoSeleccionadoObj.estado_cocina === 'Pendiente' ? '#166534' : '#9a3412'
                }}>
                  {cambioPlatoData.platoSeleccionadoObj.estado_cocina === 'Pendiente' ? (
                    <div>
                      ✅ <strong>Cocina aún no comenzó la preparación (Pendiente):</strong>
                      <div style={{ marginTop: 2 }}>
                        Los insumos del plato se reintegrarán automáticamente al almacén y al Kardex como <em>ENTRADA_DEVOLUCION</em>.
                      </div>
                    </div>
                  ) : (
                    <div>
                      ⚠️ <strong>Cocina ya comenzó o preparó el plato ({cambioPlatoData.platoSeleccionadoObj.estado_cocina}):</strong>
                      <div style={{ marginTop: 2 }}>
                        La materia prima ya fue procesada. Se declarará automáticamente como <strong>MERMA DE COCINA</strong>.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Seleccionar el Nuevo Plato (Solo si modo es CAMBIAR) */}
              {cambioPlatoData.modo !== 'CANCELAR' ? (
                <>
                  <div className="modal-section" style={{ marginTop: 14 }}>
                    <label className="modal-label">3. Nuevo Plato que el Cliente Desea</label>
                    <select
                      className="modal-input"
                      value={cambioPlatoData.nuevo_producto_id}
                      onChange={(e) => setCambioPlatoData({ ...cambioPlatoData, nuevo_producto_id: Number(e.target.value) })}
                    >
                      <option value="">-- Selecciona el nuevo plato del menú --</option>
                      {menuPlatosDisponibles.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} ({p.categoria}) — S/ {parseFloat(p.precio).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cálculo de Diferencia de Precio */}
                  {cambioPlatoData.platoSeleccionadoObj && cambioPlatoData.nuevo_producto_id && (() => {
                    const nuevo = menuPlatosDisponibles.find(p => p.id === Number(cambioPlatoData.nuevo_producto_id));
                    const precioAnterior = parseFloat(cambioPlatoData.platoSeleccionadoObj.precio || 0);
                    const precioNuevo = nuevo ? parseFloat(nuevo.precio) : 0;
                    const cant = Number(cambioPlatoData.platoSeleccionadoObj.cantidad || 1);
                    const dif = (precioNuevo - precioAnterior) * cant;
                    return (
                      <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, marginTop: 10, border: '1px solid #e2e8f0', fontSize: 13 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                          <span>Plato actual: {cambioPlatoData.platoSeleccionadoObj.nombre}</span>
                          <span>S/ {(precioAnterior * cant).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0f172a', fontWeight: 700, marginTop: 3 }}>
                          <span>Nuevo plato: {nuevo?.nombre}</span>
                          <span>S/ {(precioNuevo * cant).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTop: '1px dashed #cbd5e1', fontWeight: 800 }}>
                          <span>Ajuste en la cuenta de la mesa:</span>
                          <span style={{ color: dif > 0 ? '#16a34a' : dif < 0 ? '#ef4444' : '#0f172a' }}>
                            {dif > 0 ? `+ S/ ${dif.toFixed(2)}` : dif < 0 ? `- S/ ${Math.abs(dif).toFixed(2)}` : 'S/ 0.00 (Mismo valor)'}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                cambioPlatoData.platoSeleccionadoObj && (
                  <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: '10px 14px', borderRadius: 8, marginTop: 12, fontSize: 13, color: '#9f1239' }}>
                    <div style={{ fontWeight: 800 }}>❌ Resumen de Cancelación:</div>
                    <div style={{ marginTop: 4 }}>
                      Se eliminará de la cuenta: <strong>{cambioPlatoData.platoSeleccionadoObj.cantidad}x {cambioPlatoData.platoSeleccionadoObj.nombre}</strong>.
                    </div>
                    <div style={{ marginTop: 2, fontWeight: 700 }}>
                      Monto a descontar de la comanda: - S/ {(parseFloat(cambioPlatoData.platoSeleccionadoObj.precio || 0) * Number(cambioPlatoData.platoSeleccionadoObj.cantidad || 1)).toFixed(2)}
                    </div>
                  </div>
                )
              )}

              {/* 4. Motivo Obligatorio del Cambio */}
              <div className="modal-section" style={{ marginTop: 14 }}>
                <label className="modal-label">4. Motivo Obligatorio</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="Ej. Cliente cambió de opinión, solicitud antes de cocinar..."
                  value={cambioPlatoData.motivo}
                  onChange={(e) => setCambioPlatoData({ ...cambioPlatoData, motivo: e.target.value })}
                />
              </div>

            </div>

            <div className="pos-modal-footer">
              <button className="btn-clear" onClick={() => setShowCambioPlatoModal(false)}>Cancelar</button>
              <button
                className="btn-send"
                style={{ width: 'auto', padding: '10px 22px', background: cambioPlatoData.modo === 'CANCELAR' ? '#dc2626' : undefined }}
                onClick={handleConfirmarCambioPlato}
                disabled={submitting}
              >
                {submitting ? 'Procesando...' : cambioPlatoData.modo === 'CANCELAR' ? '❌ Confirmar Anulación & Devolución a Kardex' : '✅ Confirmar Cambio & Notificar a Cocina'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRE-CUENTA IMPRIMIBLE */}
      {preCuentaEmitida && (
        <div className="pos-modal-overlay">
          <div className="ticket-card-wrap">
            <div id="printable-ticket" className="ticket-80mm">
              <div className="ticket-header">
                <img src="/logo.jpg" alt="Don Bigote Logo" style={{ width: 48, height: 48, borderRadius: '50%' }} />
                <h2 className="ticket-brand">LA SAZÓN DE DON BIGOTE</h2>
                <h3 className="ticket-correlativo">PRE-CUENTA</h3>
                <p style={{ fontSize: 11, fontStyle: 'italic', marginBottom: 8 }}>(Documento no válido como comprobante de pago)</p>
              </div>

              <div className="ticket-info">
                <div><span>Mesa / Atend:</span> <span>{preCuentaEmitida.mesa || 'Mesa'} - {preCuentaEmitida.mesero}</span></div>
                <div><span>Fecha:</span> <span>{new Date().toLocaleString('es-PE')}</span></div>
              </div>

              <div className="ticket-divider" />

              <table className="ticket-items">
                <thead>
                  <tr>
                    <th>Cant</th>
                    <th>Descripción</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {preCuentaEmitida.items && preCuentaEmitida.items.map((it, i) => (
                    <tr key={i}>
                      <td>{it.cantidad}</td>
                      <td>{it.nombre}</td>
                      <td style={{ textAlign: 'right' }}>S/ {parseFloat(it.subtotal || (it.cantidad * it.precio)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="ticket-divider" />
              <div className="ticket-totals">
                <div className="ticket-grand-total"><span>TOTAL A PAGAR:</span> <span>S/ {parseFloat(preCuentaEmitida.total).toFixed(2)}</span></div>
              </div>
              <div className="ticket-footer">
                <p>Por favor, revise su pedido.</p>
              </div>
            </div>

            <div className="ticket-actions">
              <button className="btn-send" style={{ flex: 1, background: 'var(--slate-800)' }} onClick={() => window.print()}>
                🖨️ Imprimir Pre-Cuenta
              </button>
              <button className="btn-clear" onClick={() => setPreCuentaEmitida(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

