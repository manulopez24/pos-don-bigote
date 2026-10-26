import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { socket } from './socket';

const API   = ``;

const CATEGORY_ICONS = {
  'Cebiche': '🐟', 'Cebiches': '🐟',
  'Tiradito': '🦈', 'Tiraditos': '🦈',
  'Leche de Tigre': '🐯', 'Bebidas': '🥤', 'Bebidas Frías': '🥤',
  'Postres': '🍮', 'Entradas': '🥗',
  'Fondos': '🍲', 'Mariscos': '🦞',
  'Arroces': '🍚', 'Sopas': '🍜', 'Sudados': '🍲', 'Parihuela': '🍲',
  'Fuentes Marinas (4 Personas)': '🦑', 'Tortillas': '🍳',
  'Especialidades de la Casa': '⭐', 'Comidas Criollas': '🥘',
  'Platos Especiales': '🍽️', 'Guarniciones': '🥔', 'Cervezas': '🍺', 'Helados': '🍦'
};
const getCatIcon = (cat) => CATEGORY_ICONS[cat] ?? '🍽️';

function SkeletonGrid() {
  return <>
    {Array.from({ length: 9 }).map((_, i) => (
      <div key={i} className="skeleton-card"><div className="skeleton-shimmer" /></div>
    ))}
  </>;
}

function Toast({ message, type, visible }) {
  return (
    <div className={`toast ${type} ${visible ? 'show' : ''}`}>
      {type === 'success' ? '✅' : '❌'} {message}
    </div>
  );
}

export default function WaiterPOS({ user }) {
  const [waiterTab,   setWaiterTab]   = useState('menu'); // 'menu' | 'mis-pedidos'
  const [menu,        setMenu]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [dbError,     setDbError]     = useState(null);
  const [activeCat,   setActiveCat]   = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart,        setCart]        = useState([]);
  const [listaMesas,  setListaMesas]  = useState([]);
  const [mesa,        setMesa]        = useState('');
  const [tipoPedido,  setTipoPedido]  = useState('Mesa'); // 'Mesa' | 'Llevar' | 'Delivery'
  const [sending,     setSending]     = useState(false);
  const [toast,       setToast]       = useState({ visible: false, message: '', type: 'success' });
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showMapaMesas,  setShowMapaMesas]  = useState(false);
  const [notaModal,      setNotaModal]      = useState({ visible: false, itemId: null, text: '' });

  // Estado de Mis Pedidos del Mesero
  const [misPedidos,  setMisPedidos]  = useState([]);
  const [loadingMisP, setLoadingMisP] = useState(false);

  // Alertas tempranas de Stock Crítico y Recetas en Tiempo Real
  const [insumosCriticos, setInsumosCriticos] = useState([]);
  const [fichasRecetas,   setFichasRecetas]   = useState([]);
  const [showStockAlert,  setShowStockAlert]  = useState(false);
  const [ventasBloqueadas, setVentasBloqueadas] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 4000);
  };

  const cargarEstadoJornada = useCallback(() => {
    axios.get(`${API}/api/caja/estado-jornada`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(({ data }) => setVentasBloqueadas(Boolean(data.ventas_bloqueadas)))
      .catch((err) => console.error('Error cargando estado jornada en mesero:', err));
  }, [user.token]);

  const cargarMenuDesdeBD = useCallback(() => {
    setLoading(true);
    setDbError(null);
    axios.get(`${API}/api/menu`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(({ data }) => {
        setMenu(data);
        setLoading(false);
      })
      .catch((err) => {
        const msg = err.response?.data?.error || 'No se pudo conectar con la BD MySQL';
        setDbError(msg);
        setLoading(false);
      });
  }, [user.token]);

  const cargarMesasBD = useCallback(() => {
    axios.get(`${API}/api/mesas`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(({ data }) => {
        setListaMesas(data);
        if (data.length > 0 && !mesa) setMesa(data[0].nombre);
      })
      .catch((err) => console.error('Error cargando mesas:', err));
  }, [user.token, mesa]);

  const cargarMisPedidosBD = useCallback(() => {
    setLoadingMisP(true);
    axios.get(`${API}/api/mesero/mis-pedidos`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(({ data }) => {
        setMisPedidos(data);
        setLoadingMisP(false);
      })
      .catch((err) => {
        console.error('Error cargando mis pedidos:', err);
        setLoadingMisP(false);
      });
  }, [user.token]);

  // Permitir al mesero marcar entrega de bebidas y despachos directos
  const cambiarEstadoBebida = async (detalleId, estadoActual) => {
    const nuevoEstado = estadoActual === 'Despachado' ? 'Pendiente' : 'Despachado';
    try {
      await axios.put(`${API}/api/cocina/detalles/${detalleId}/estado`, 
        { estado: nuevoEstado }, 
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setMisPedidos(prev => prev.map(ped => ({
        ...ped,
        items: ped.items.map(it => it.detalle_id === detalleId ? { ...it, estado_cocina: nuevoEstado } : it)
      })));
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo actualizar la entrega de la bebida.');
    }
  };

  // Cargar inventario crítico y fichas de recetas para el mesero
  const cargarStockYRecetas = useCallback(() => {
    const headers = { headers: { Authorization: `Bearer ${user.token}` } };
    axios.get(`${API}/api/inventario/stock-critico`, headers)
      .then(({ data }) => setInsumosCriticos(data || []))
      .catch(err => console.error('Error cargando stock crítico:', err));

    axios.get(`${API}/api/cocina/recetas`, headers)
      .then(({ data }) => setFichasRecetas(data || []))
      .catch(err => console.error('Error cargando recetas:', err));
  }, [user.token]);

  useEffect(() => {
    cargarMenuDesdeBD();
    cargarMesasBD();
    cargarStockYRecetas();
    cargarEstadoJornada();
  }, [cargarMenuDesdeBD, cargarMesasBD, cargarStockYRecetas, cargarEstadoJornada]);

  // TIEMPO REAL: WebSockets con Socket.io (reemplaza polling en Mesero)
  useEffect(() => {
    if (waiterTab === 'mis-pedidos') {
      cargarMisPedidosBD();
    }

    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('unirse_sala', { rol: 'mesero', usuario_id: user?.id });

    const handleActualizarMesasYPedidos = () => {
      cargarMesasBD();
      cargarMisPedidosBD();
    };

    const handleEstadoCocina = () => {
      cargarMisPedidosBD();
    };

    const handleStockActualizado = () => {
      cargarStockYRecetas();
    };

    const handleEstadoJornada = (data) => {
      cargarEstadoJornada();
      if (data?.ventas_bloqueadas) {
        setVentasBloqueadas(true);
      } else if (data?.ventas_bloqueadas === false) {
        setVentasBloqueadas(false);
      }
    };

    socket.on('CAMBIO_MESAS', handleActualizarMesasYPedidos);
    socket.on('PEDIDO_COBRADO', handleActualizarMesasYPedidos);
    socket.on('ESTADO_COCINA_ACTUALIZADO', handleEstadoCocina);
    socket.on('STOCK_ACTUALIZADO', handleStockActualizado);
    socket.on('ESTADO_JORNADA_ACTUALIZADO', handleEstadoJornada);
    socket.on('VENTAS_BLOQUEADAS', () => setVentasBloqueadas(true));
    socket.on('VENTAS_REACTIVADAS', () => setVentasBloqueadas(false));

    return () => {
      socket.off('CAMBIO_MESAS', handleActualizarMesasYPedidos);
      socket.off('PEDIDO_COBRADO', handleActualizarMesasYPedidos);
      socket.off('ESTADO_COCINA_ACTUALIZADO', handleEstadoCocina);
      socket.off('STOCK_ACTUALIZADO', handleStockActualizado);
      socket.off('ESTADO_JORNADA_ACTUALIZADO', handleEstadoJornada);
      socket.off('VENTAS_BLOQUEADAS');
      socket.off('VENTAS_REACTIVADAS');
    };
  }, [waiterTab, cargarMisPedidosBD, cargarMesasBD, cargarStockYRecetas, cargarEstadoJornada, user?.id]);


  const categories = useMemo(() => ['Todos', ...new Set(menu.map((p) => p.categoria))], [menu]);

  const filteredMenu = useMemo(() => {
    return menu.filter((p) => {
      const matchCat   = activeCat === 'Todos' || p.categoria === activeCat;
      const matchSearch= p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.categoria.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [menu, activeCat, searchQuery]);

  // Evaluar estado de stock del plato según sus ingredientes en tiempo real
  const getEstadoStockPlato = useCallback((productoId) => {
    const receta = fichasRecetas.find(r => r.producto_id === productoId);
    if (!receta || !receta.ingredientes || receta.ingredientes.length === 0) {
      return null;
    }

    const agotado = receta.ingredientes.find(ing => Number(ing.stock_actual) <= 0);
    if (agotado) {
      return { tipo: 'AGOTADO', label: '🚫 Agotado', insumo: agotado.nombre };
    }

    const pocoStock = receta.ingredientes.find(ing => Number(ing.stock_actual) <= Math.max(1, Number(ing.cantidad_unitaria) * 2));
    if (pocoStock) {
      return { tipo: 'POCO_STOCK', label: '⚠️ Poco Stock', insumo: pocoStock.nombre };
    }

    return null;
  }, [fichasRecetas]);

  const addToCart = useCallback((producto) => {
    const estado = getEstadoStockPlato(producto.id);
    if (estado?.tipo === 'AGOTADO') {
      showToast(`🚫 No disponible: ${estado.insumo} está agotado en almacén`, 'error');
      return;
    }
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.id === producto.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], cantidad: updated[idx].cantidad + 1 };
        return updated;
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  }, [getEstadoStockPlato]);

  const changeQty = useCallback((id, delta) => {
    setCart((prev) =>
      prev.map((i) => i.id === id ? { ...i, cantidad: i.cantidad + delta } : i)
          .filter((i) => i.cantidad > 0)
    );
  }, []);

  const saveNota = () => {
    setCart(prev => prev.map(i => i.id === notaModal.itemId ? { ...i, notas: notaModal.text } : i));
    setNotaModal({ visible: false, itemId: null, text: '' });
  };

  const totalItems = cart.reduce((a, i) => a + i.cantidad, 0);
  const totalPrice = cart.reduce((a, i) => a + i.cantidad * parseFloat(i.precio), 0);

  // Enviar comanda real
  const handleEnviar = async () => {
    if (!cart.length || sending) return;
    if (ventasBloqueadas) {
      showToast('⛔ Las ventas están bloqueadas. La jornada diaria ha sido finalizada.', 'error');
      return;
    }
    setSending(true);
    try {
      await axios.post(`${API}/api/pedidos`, {
        mesa_nombre: tipoPedido === 'Mesa' ? mesa : tipoPedido,
        items: cart,
        tipo_pedido: tipoPedido
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      showToast(`🎉 Pedido enviado a cocina (${tipoPedido === 'Mesa' ? mesa : tipoPedido})!`, 'success');
      setCart([]);
      setShowMobileCart(false);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Error al enviar el pedido.';
      showToast(errorMsg, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="pos-body mobile-waiter-body">
      {/* ── ALERTA DE VENTAS BLOQUEADAS ── */}
      {ventasBloqueadas && (
        <div style={{
          background: '#fee2e2',
          border: '2px solid #ef4444',
          borderRadius: 8,
          padding: '10px 14px',
          color: '#991b1b',
          fontWeight: 800,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6
        }}>
          <span>⛔</span>
          <span>JORNADA FINALIZADA — Las ventas están bloqueadas. Solicita al Administrador reactivar las ventas para ingresar nuevas órdenes.</span>
        </div>
      )}

      {/* ── NAVEGACIÓN SUPERIOR DE MESERO: TOMAR PEDIDO VS MIS COMANDAS ── */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          className={`filter-tab ${waiterTab === 'menu' ? 'active' : ''}`}
          style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}
          onClick={() => setWaiterTab('menu')}
        >
          🍽️ Tomar Pedido / Menú
        </button>
        <button
          className={`filter-tab ${waiterTab === 'mis-pedidos' ? 'active' : ''}`}
          style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}
          onClick={() => setWaiterTab('mis-pedidos')}
        >
          📋 Mis Mesas & Pedidos ({misPedidos.length})
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════
         VISTA 1: TOMAR PEDIDO (MENÚ + BUSCADOR)
         ═══════════════════════════════════════════════════════════ */}
      {waiterTab === 'menu' && (
        <>
          {/* BARRA SUPERIOR MÓVIL: Buscador + Selección de Tipo & Mesa */}
          <div className="mobile-top-bar" style={{ flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <div className="pos-search-wrap mobile-search">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="pos-search-input"
                  placeholder="Buscar plato (Ceviche, Chaufa, Helado)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="search-clear-btn" onClick={() => setSearchQuery('')}>✕</button>
                )}
              </div>

              <select
                className="mesa-selector"
                style={{ width: 110 }}
                value={tipoPedido}
                onChange={(e) => setTipoPedido(e.target.value)}
              >
                <option value="Mesa">🍽️ Mesa</option>
                <option value="Llevar">🛍️ Llevar</option>
                <option value="Delivery">🛵 Delivery</option>
              </select>

              {tipoPedido === 'Mesa' && (
                <button 
                  className="mesa-selector mobile-mesa-select" 
                  onClick={() => setShowMapaMesas(true)}
                  style={{ textAlign: 'left', paddingRight: '12px', background: '#e0f2fe', borderColor: '#0ea5e9' }}
                >
                  📍 {mesa || 'Elegir'}
                </button>
              )}
            </div>
          </div>

          {/* ALERTA DE STOCK CRÍTICO EN ALMACÉN */}
          {insumosCriticos.length > 0 && (
            <div style={{
              background: '#fff7ed',
              border: '1px solid #fdba74',
              borderRadius: 8,
              padding: '7px 12px',
              margin: '2px 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12
            }}>
              <span style={{ color: '#c2410c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>⚠️</span> Alerta Almacén: {insumosCriticos.length} insumos en nivel crítico o agotados
              </span>
              <button 
                onClick={() => setShowStockAlert(!showStockAlert)}
                style={{ background: '#ffedd5', border: 'none', borderRadius: 4, padding: '3px 8px', color: '#9a3412', fontWeight: 700, cursor: 'pointer', fontSize: 11 }}
              >
                {showStockAlert ? '▲ Ocultar' : '▼ Ver'}
              </button>
            </div>
          )}

          {showStockAlert && insumosCriticos.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #fed7aa', borderRadius: 8, padding: 8, marginBottom: 8, fontSize: 11 }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: '#9a3412' }}>Insumos con poco o nulo stock en cocina/almacén:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {insumosCriticos.map(ins => {
                  const agot = Number(ins.stock_actual) <= 0;
                  return (
                    <span key={ins.id} style={{ 
                      background: agot ? '#fee2e2' : '#fef3c7', 
                      color: agot ? '#b91c1c' : '#b45309',
                      border: `1px solid ${agot ? '#fca5a5' : '#fde68a'}`,
                      padding: '2px 8px', 
                      borderRadius: 4,
                      fontWeight: 700
                    }}>
                      {ins.nombre}: {Number(ins.stock_actual).toFixed(2)} {ins.unidad_medida} {agot ? '(AGOTADO)' : '(BAJO)'}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* CATEGORÍAS EN CHIPS HORIZONTALES */}
          <div className="mobile-categories-scroll">
            {categories.map((cat) => {
              const count = cat === 'Todos' ? menu.length : menu.filter((p) => p.categoria === cat).length;
              return (
                <button key={cat} className={`cat-chip ${activeCat === cat ? 'active' : ''}`}
                  onClick={() => setActiveCat(cat)}>
                  <span className="chip-icon">{cat === 'Todos' ? '🗂️' : getCatIcon(cat)}</span>
                  <span>{cat}</span>
                  <span className="chip-count">{count}</span>
                </button>
              );
            })}
          </div>

          {/* GRILLA DE PLATOS */}
          <section className="menu-panel mobile-menu-panel">
            <div className="mobile-results-info">
              <span>{activeCat}</span>
              <small>{filteredMenu.length} platos</small>
            </div>

            {dbError ? (
              <div className="empty-state" style={{ background: '#fee2e2', borderRadius: 12, padding: 24, border: '1px solid #fca5a5' }}>
                <span className="es-icon">⚠️</span>
                <h3 style={{ color: '#991b1b', margin: '4px 0' }}>Error de conexión con MySQL</h3>
                <p style={{ color: '#b91c1c', fontSize: 13, textAlign: 'center' }}>{dbError}</p>
                <button className="btn-send" style={{ width: 'auto', padding: '8px 20px', marginTop: 12, fontSize: 13 }} onClick={cargarMenuDesdeBD}>
                  🔄 Reintentar conexión
                </button>
              </div>
            ) : (
              <div className="mobile-products-grid">
                {loading ? <SkeletonGrid /> : filteredMenu.length === 0 ? (
                  <div className="empty-state">
                    <span className="es-icon">🔍</span>
                    <p>No se encontraron platos {searchQuery ? `para "${searchQuery}"` : ''}</p>
                  </div>
                ) : filteredMenu.map((producto) => {
                  const inCart = cart.find(c => c.id === producto.id);
                  const estadoStock = getEstadoStockPlato(producto.id);
                  const isAgotado = estadoStock?.tipo === 'AGOTADO';

                  return (
                    <div 
                      key={producto.id} 
                      className={`mobile-product-card ${inCart ? 'in-cart' : ''}`} 
                      onClick={() => addToCart(producto)}
                      style={{
                        position: 'relative',
                        opacity: isAgotado ? 0.65 : 1,
                        border: isAgotado ? '1px dashed #ef4444' : undefined,
                        cursor: isAgotado ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {inCart && <div className="card-qty-badge">{inCart.cantidad}</div>}
                      {estadoStock && (
                        <div style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          background: isAgotado ? '#ef4444' : '#f59e0b',
                          color: '#fff',
                          fontSize: 9,
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: 4,
                          zIndex: 2,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }} title={estadoStock.insumo ? `Insumo afectado: ${estadoStock.insumo}` : ''}>
                          {estadoStock.label}
                        </div>
                      )}
                      <div className="mp-info">
                        <span className="mp-name">{producto.nombre}</span>
                        <span className="mp-cat">{producto.categoria}</span>
                      </div>
                      <div className="mp-price-action">
                        <span className="mp-price">S/ {parseFloat(producto.precio).toFixed(2)}</span>
                        <button className="mp-add-btn" style={{ background: isAgotado ? '#94a3b8' : undefined }}>
                          {isAgotado ? '✕' : '+'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* DRAWER / PANEL DE COMANDA */}
          <aside className={`order-panel mobile-order-drawer ${showMobileCart ? 'mobile-open' : ''}`}>
            <div className="order-panel__header">
              <div className="order-panel__title">
                <span className="order-icon">🧾</span> Comanda {tipoPedido === 'Mesa' ? mesa : tipoPedido}
              </div>
              <button className="modal-close-btn" style={{ color: '#fff' }} onClick={() => setShowMobileCart(false)}>✕</button>
            </div>

            <div className="order-items">
              {cart.length === 0 ? (
                <div className="order-empty">
                  <span className="oe-icon">🛒</span>
                  <p>Toca un plato para agregarlo</p>
                </div>
              ) : cart.map((item) => (
                <div key={item.id} className="order-item">
                  <div className="order-item__info">
                    <div className="order-item__name" title={item.nombre}>{item.nombre}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <div className="order-item__subtotal">
                        S/ {(item.cantidad * parseFloat(item.precio)).toFixed(2)}
                      </div>
                      <button 
                        className="btn-clear" 
                        style={{ padding: '2px 6px', fontSize: 10, height: 'auto', background: item.notas ? '#fee2e2' : 'transparent', color: item.notas ? '#ef4444' : '#64748b' }}
                        onClick={() => setNotaModal({ visible: true, itemId: item.id, text: item.notas || '' })}
                      >
                        {item.notas ? '📝 Modificado' : '✏️ Nota'}
                      </button>
                    </div>
                    {item.notas && <div style={{ fontSize: 10, color: '#ef4444', fontStyle: 'italic', marginTop: 2 }}>"{item.notas}"</div>}
                  </div>
                  <div className="order-item__controls">
                    <button className="qty-btn minus" onClick={() => changeQty(item.id, -1)}>−</button>
                    <span className="qty-display">{item.cantidad}</span>
                    <button className="qty-btn plus"  onClick={() => changeQty(item.id, +1)}>+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="order-footer">
              <div className="order-summary">
                <div className="order-summary__row total">
                  <span>TOTAL ({totalItems} items)</span>
                  <span className="total-amount">S/ {totalPrice.toFixed(2)}</span>
                </div>
              </div>
              <button 
                className="btn-send" 
                onClick={handleEnviar} 
                disabled={cart.length === 0 || sending || ventasBloqueadas}
                style={{
                  background: ventasBloqueadas ? '#94a3b8' : undefined,
                  cursor: ventasBloqueadas ? 'not-allowed' : 'pointer'
                }}
              >
                {ventasBloqueadas ? '⛔ Ventas Bloqueadas (Fin de Día)' : sending ? 'Enviando a Cocina...' : `🔔 Enviar Pedido (${tipoPedido === 'Mesa' ? mesa : tipoPedido})`}
              </button>
            </div>
          </aside>

          {/* BOTÓN FLOTANTE INFERIOR */}
          {totalItems > 0 && (
            <div className="mobile-sticky-footer">
              <button className="mobile-cart-btn" onClick={() => setShowMobileCart(true)}>
                <span className="mcb-left">🛒 {totalItems} items ({tipoPedido === 'Mesa' ? mesa : tipoPedido})</span>
                <span className="mcb-right">S/ {totalPrice.toFixed(2)} ❯</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
         VISTA 2: MIS MESAS & COMANDAS ACTIVAS DEL MESERO
         ═══════════════════════════════════════════════════════════ */}
      {waiterTab === 'mis-pedidos' && (
        <section className="menu-panel mobile-menu-panel">
          <div className="mobile-results-info">
            <span>Comandas en atención</span>
            <button className="btn-send" style={{ width: 'auto', padding: '4px 12px', fontSize: 11 }} onClick={cargarMisPedidosBD}>
              🔄 Actualizar
            </button>
          </div>

          {loadingMisP ? (
            <div className="kitch-empty"><p>Cargando tus mesas activas...</p></div>
          ) : misPedidos.length === 0 ? (
            <div className="kitch-empty">
              <span style={{ fontSize: 54 }}>🧑‍🍽️</span>
              <p style={{ fontWeight: 700, fontSize: 16 }}>No tienes comandas abiertas</p>
              <small style={{ color: 'var(--text-muted)' }}>
                Toma un pedido para una mesa y aparecerá aquí el estado de preparación de la cocina.
              </small>
            </div>
          ) : (
            <div className="kitchen-grid" style={{ paddingBottom: 20 }}>
              {misPedidos.map((ped) => (
                <div key={ped.pedido_id} className="comanda-card comanda-card--pendiente">
                  <div className="comanda-card__header">
                    <span className="comanda-mesa">{ped.mesa}</span>
                    <span className="comanda-hora">🕐 {ped.hora}</span>
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cyan-500)' }}>
                    Total hasta ahora: S/ {parseFloat(ped.total).toFixed(2)}
                  </div>

                  <ul className="comanda-items">
                    {ped.items.map((it) => {
                      const esBebida = it.tipo_producto === 'DIRECTO' || 
                        ['Bebidas', 'Bebidas Frías', 'Cervezas', 'Helados'].includes(it.categoria);

                      if (esBebida) {
                        const entregada = it.estado_cocina === 'Despachado';
                        return (
                          <li key={it.detalle_id} className="comanda-item" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span className="ci-qty">×{it.cantidad}</span>
                              <span className="ci-name">{it.nombre}</span>
                              <span style={{ fontSize: 10, color: 'var(--cyan-500)', marginLeft: 6, fontWeight: 700 }}>🥤 Barra / Bebida</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => cambiarEstadoBebida(it.detalle_id, it.estado_cocina)}
                              className="comanda-estado"
                              style={{
                                cursor: 'pointer',
                                border: entregada ? '1px solid #86efac' : '1px solid #7dd3fc',
                                fontWeight: 700,
                                fontSize: 11,
                                padding: '4px 10px',
                                borderRadius: 8,
                                background: entregada ? '#dcfce7' : '#e0f2fe',
                                color: entregada ? '#166534' : '#0369a1',
                                transition: 'all 0.15s ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                              }}
                              title="Toca para marcar como entregado a mesa o por entregar"
                            >
                              {entregada ? '✅ Entregada a Mesa' : '🥤 Por Entregar (Tocar)'}
                            </button>
                          </li>
                        );
                      }

                      // Plato de Cocina: Controlado estrictamente por Cocina
                      const estColor = it.estado_cocina === 'Despachado' ? '#16a34a' : it.estado_cocina === 'Preparando' ? '#f97316' : '#ef4444';
                      const estBg    = it.estado_cocina === 'Despachado' ? '#dcfce7' : it.estado_cocina === 'Preparando' ? '#ffedd5' : '#fee2e2';
                      const estLabel = it.estado_cocina === 'Despachado' ? '✅ Listo para servir' : it.estado_cocina === 'Preparando' ? '🔥 Preparando' : '⏳ En cola';
                      return (
                        <li key={it.detalle_id} className="comanda-item" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span className="ci-qty">×{it.cantidad}</span>
                            <span className="ci-name">{it.nombre}</span>
                          </div>
                          <span 
                            className="comanda-estado" 
                            style={{ color: estColor, background: estBg, cursor: 'default', userSelect: 'none' }}
                            title={`Estado en Cocina: ${it.estado_cocina || 'Pendiente'} (Controlado por Cocina)`}
                          >
                            {estLabel}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  <button
                    className="btn-send"
                    style={{ marginTop: 10, fontSize: 12, padding: '8px' }}
                    onClick={() => {
                      setMesa(ped.mesa);
                      setTipoPedido('Mesa');
                      setWaiterTab('menu');
                    }}
                  >
                    ➕ Agregar más cosas a {ped.mesa}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* MODAL: MAPA DE MESAS */}
      {showMapaMesas && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '90%', maxWidth: 400, padding: 20 }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>📍 Seleccionar Mesa</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {listaMesas.map(m => (
                <button
                  key={m.id}
                  style={{
                    padding: '16px 8px',
                    borderRadius: 8,
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 14,
                    color: '#fff',
                    background: m.estado === 'Libre' ? 'var(--green)' : 'var(--danger)',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  onClick={() => {
                    setMesa(m.nombre);
                    setShowMapaMesas(false);
                  }}
                >
                  {m.nombre}
                  <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.9 }}>{m.estado}</div>
                </button>
              ))}
            </div>
            <button className="btn-clear" style={{ marginTop: 20, width: '100%' }} onClick={() => setShowMapaMesas(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* MODAL: NOTAS DE COCINA */}
      {notaModal.visible && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '90%', maxWidth: 350, padding: 20 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>✏️ Nota Especial (Cocina)</h3>
            <textarea
              autoFocus
              className="pos-input"
              style={{ width: '100%', height: 80, resize: 'none', marginBottom: 16 }}
              placeholder="Ej: Sin ají, poco limón, para llevar..."
              value={notaModal.text}
              onChange={e => setNotaModal({ ...notaModal, text: e.target.value })}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-clear" style={{ flex: 1 }} onClick={() => setNotaModal({ visible: false, itemId: null, text: '' })}>Cancelar</button>
              <button className="btn-send" style={{ flex: 1 }} onClick={saveNota}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </main>
  );
}

