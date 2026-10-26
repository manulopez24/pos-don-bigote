import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { socket } from './socket';

const API = ``;

const ESTADO_CONFIG = {
  'Pendiente':  { label: '⏳ Pendiente',   color: '#ef4444', bg: '#fee2e2' },
  'Preparando': { label: '🔥 Preparando',  color: '#f97316', bg: '#ffedd5' },
  'Despachado': { label: '✅ Despachado',  color: '#16a34a', bg: '#dcfce7' },
};

export default function KitchenView({ user }) {
  const [comandas, setComandas] = useState([]);
  const [filtro,   setFiltro]   = useState('todos');
  const [loading,  setLoading]  = useState(true);
  const [alertaCambio, setAlertaCambio] = useState(null);

  // Estados de Fichas Técnicas & Escandallos en KG/GR
  const [showFichasModal, setShowFichasModal] = useState(false);
  const [fichasRecetas, setFichasRecetas] = useState([]);
  const [searchFicha, setSearchFicha] = useState('');
  const [fichaSeleccionada, setFichaSeleccionada] = useState(null);
  const [multiplicadorPorciones, setMultiplicadorPorciones] = useState(1);
  const [insumosCriticos, setInsumosCriticos] = useState([]);
  const [expandedItems, setExpandedItems] = useState({}); // detalle_id -> boolean

  // Cargar comandas reales desde la BD MySQL
  const cargarComandasBD = useCallback(() => {
    axios.get(`${API}/api/cocina/pedidos`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(({ data }) => {
        setComandas(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error cargando cocina:', err);
        setLoading(false);
      });
  }, [user.token]);

  // Cargar libro de Fichas Técnicas & Escandallos (en KG/GR)
  const cargarRecetasCocina = useCallback(() => {
    axios.get(`${API}/api/cocina/recetas`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(({ data }) => {
        setFichasRecetas(data);
        if (data.length > 0 && !fichaSeleccionada) {
          setFichaSeleccionada(data[0]);
        }
      })
      .catch((err) => console.error('Error cargando recetas:', err));
  }, [user.token, fichaSeleccionada]);

  // Cargar alertas de stock crítico de insumos
  const cargarStockCritico = useCallback(() => {
    axios.get(`${API}/api/inventario/stock-critico`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(({ data }) => setInsumosCriticos(data))
      .catch((err) => console.error('Error cargando stock crítico:', err));
  }, [user.token]);

  // TIEMPO REAL: WebSockets con Socket.io (reemplaza polling continuo)
  useEffect(() => {
    cargarComandasBD();
    cargarStockCritico();

    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('unirse_sala', { rol: 'cocina', usuario_id: user?.id });

    // Cuando un mesero envía una orden, actualizar cocina de inmediato
    const handleNuevaComanda = () => {
      cargarComandasBD();
      cargarStockCritico();
    };

    // Actualización de estado en tiempo real
    const handleEstadoActualizado = ({ detalle_id, estado }) => {
      setComandas(prevComandas => 
        prevComandas.map(c => ({
          ...c,
          items: c.items.map(item => 
            item.detalle_id === detalle_id ? { ...item, estado_cocina: estado } : item
          )
        })).filter(c => c.items.some(i => i.estado_cocina !== 'Despachado'))
      );
    };

    // Si se cobra un pedido, sincronizar
    const handlePedidoCobrado = () => {
      cargarComandasBD();
      cargarStockCritico();
    };

    // Alerta de cambio de plato autorizado por Caja/Admin
    const handleCambioPlato = (data) => {
      cargarComandasBD();
      cargarStockCritico();
      setAlertaCambio(data);
      setTimeout(() => setAlertaCambio(null), 12000);
    };

    const handleStockActualizado = () => {
      cargarStockCritico();
      cargarComandasBD();
    };

    socket.on('NUEVA_COMANDA', handleNuevaComanda);
    socket.on('ESTADO_COCINA_ACTUALIZADO', handleEstadoActualizado);
    socket.on('PEDIDO_COBRADO', handlePedidoCobrado);
    socket.on('CAMBIO_PLATO_COMANDA', handleCambioPlato);
    socket.on('STOCK_ACTUALIZADO', handleStockActualizado);

    return () => {
      socket.off('NUEVA_COMANDA', handleNuevaComanda);
      socket.off('ESTADO_COCINA_ACTUALIZADO', handleEstadoActualizado);
      socket.off('PEDIDO_COBRADO', handlePedidoCobrado);
      socket.off('CAMBIO_PLATO_COMANDA', handleCambioPlato);
      socket.off('STOCK_ACTUALIZADO', handleStockActualizado);
    };
  }, [cargarComandasBD, cargarStockCritico, user?.id]);

  const cambiarEstadoDetalle = async (detalleId, nuevoEstado) => {
    // Actualización optimista inmediata en UI
    setComandas(prev => prev.map(c => ({
      ...c,
      items: c.items.map(i => i.detalle_id === detalleId ? { ...i, estado_cocina: nuevoEstado } : i)
    })));

    try {
      await axios.put(`${API}/api/cocina/detalles/${detalleId}/estado`, { estado: nuevoEstado }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
    } catch (err) {
      console.error('Error actualizando estado:', err);
      cargarComandasBD(); // Revertir en caso de error
    }
  };

  const comandasFiltradas = comandas.filter(c => {
    if (filtro === 'todos') return true;
    return c.items.some(i => i.estado_cocina === filtro);
  });

  const totalPendientes = comandas.reduce((acc, c) => acc + c.items.filter(i => i.estado_cocina === 'Pendiente').length, 0);
  const totalPreparando = comandas.reduce((acc, c) => acc + c.items.filter(i => i.estado_cocina === 'Preparando').length, 0);

  return (
    <div className="kitchen-view">
      {/* Encabezado de Cocina */}
      <div className="view-header kitchen-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="view-header__left">
          <h2 className="view-title">👨‍🍳 Pantalla de Cocina — Don Bigote</h2>
          <p className="view-subtitle">Monitor de comandas en tiempo real & Escandallos en KG/GR</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Botón de Recetario y Fichas Técnicas en KG/GR */}
          <button
            className="btn-send"
            style={{ width: 'auto', padding: '8px 16px', background: '#0284c7', fontSize: 13, fontWeight: 700 }}
            onClick={() => {
              cargarRecetasCocina();
              setShowFichasModal(true);
            }}
          >
            📖 Fichas Técnicas & Escandallos (en KG/GR)
          </button>

          {/* Chip de Stock Crítico en Cocina */}
          {insumosCriticos.length > 0 && (
            <div
              style={{
                background: '#fee2e2',
                border: '1px solid #f87171',
                color: '#b91c1c',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer'
              }}
              onClick={() => {
                cargarRecetasCocina();
                setShowFichasModal(true);
              }}
              title="Haz clic para ver insumos con stock bajo"
            >
              ⚠️ {insumosCriticos.length} Insumos en Stock Crítico
            </div>
          )}

          <div className="kitchen-stats">
            <div className="kstat kstat--red">
              <span className="kstat__num">{totalPendientes}</span>
              <span className="kstat__label">Pendientes</span>
            </div>
            <div className="kstat kstat--orange">
              <span className="kstat__num">{totalPreparando}</span>
              <span className="kstat__label">En preparación</span>
            </div>
          </div>
        </div>
      </div>

      {/* Banner de Alerta en Tiempo Real: Cambio de Plato Autorizado */}
      {alertaCambio && (
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '2px solid #f59e0b',
          borderRadius: 10,
          padding: '12px 18px',
          margin: '0 0 16px 0',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'pulse 1.5s infinite'
        }}>
          <div>
            <div style={{ fontWeight: 800, color: '#92400e', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🔄</span> ¡ATENCIÓN COCINA! CAMBIO DE PLATO AUTORIZADO — MESA: {alertaCambio.mesa}
            </div>
            <div style={{ fontSize: 13, color: '#78350f', marginTop: 3 }}>
              Se canceló <strong style={{ color: '#b91c1c', textDecoration: 'line-through' }}>{alertaCambio.anterior}</strong> y se preparará <strong style={{ color: '#15803d' }}>{alertaCambio.nuevo}</strong>.
              {alertaCambio.fue_merma ? ' ⚠️ (Plato anterior declarado como merma).' : ' (Plato anterior estaba pendiente).'}
              {alertaCambio.motivo && ` Motivo: "${alertaCambio.motivo}"`}
            </div>
          </div>
          <button
            onClick={() => setAlertaCambio(null)}
            style={{ background: '#d97706', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
          >
            Entendido ✓
          </button>
        </div>
      )}

      {/* Pestañas de filtro */}
      <div className="filter-tabs">
        {[['todos','🗂️ Todas'], ['Pendiente','⏳ Pendientes'], ['Preparando','🔥 En Preparación']].map(([key, label]) => (
          <button key={key} className={`filter-tab ${filtro === key ? 'active' : ''}`}
            onClick={() => setFiltro(key)}>{label}</button>
        ))}
      </div>

      {/* Rejilla de Comandas Reales */}
      <div className="kitchen-grid">
        {loading ? (
          <div className="kitch-empty"><p>Cargando comandas desde MySQL...</p></div>
        ) : comandasFiltradas.length === 0 ? (
          <div className="kitch-empty">
            <span style={{ fontSize: 54 }}>👨‍🍳</span>
            <p style={{ fontWeight: 700, fontSize: 16 }}>No hay comandas activas en cocina</p>
            <small style={{ color: 'var(--text-muted)' }}>
              Cuando los meseros envíen un pedido desde su celular, aparecerá aquí al instante.
            </small>
          </div>
        ) : comandasFiltradas.map((comanda) => (
          <div key={comanda.id} className="comanda-card comanda-card--pendiente">
            <div className="comanda-card__header">
              <span className="comanda-mesa">{comanda.mesa}</span>
              <span className="comanda-hora">🕐 {comanda.hora}</span>
            </div>

            <div style={{ fontSize: 12, color: 'var(--navy-700)', fontWeight: 600 }}>
              👤 Mesero/a: <strong>{comanda.mesero}</strong>
            </div>

            <ul className="comanda-items">
              {comanda.items.map((item) => {
                const est = ESTADO_CONFIG[item.estado_cocina] || ESTADO_CONFIG['Pendiente'];
                const notaTexto = item.notas_cocina || item.notas;
                return (
                  <li key={item.detalle_id} className="comanda-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                      <span className="ci-qty">×{item.cantidad}</span>
                      <span className="ci-name" style={{ flex: 1 }}>{item.nombre}</span>
                      <span className="comanda-estado" style={{ color: est.color, background: est.bg }}>
                        {est.label}
                      </span>
                    </div>

                    {notaTexto && (
                      <div style={{ 
                        background: '#fef2f2', 
                        color: '#b91c1c', 
                        padding: '6px 10px', 
                        borderRadius: 6, 
                        borderLeft: '4px solid #ef4444',
                        fontWeight: 'bold',
                        fontSize: 13,
                        marginTop: 4,
                        width: '100%'
                      }}>
                        ⚠️ NOTA: {notaTexto}
                      </div>
                    )}

                    {/* Escandallo de Insumos / Receta para Cocina en KG/GR */}
                    {item.insumos && item.insumos.length > 0 && (
                      <div style={{ width: '100%', marginTop: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn-clear"
                            style={{ padding: '2px 8px', fontSize: 11, color: '#0284c7', borderColor: '#bae6fd', background: '#f0f9ff' }}
                            onClick={() => setExpandedItems(prev => ({ ...prev, [item.detalle_id]: !prev[item.detalle_id] }))}
                          >
                            {expandedItems[item.detalle_id] ? '🔼 Ocultar Receta' : `🧂 Ver Receta en KG/GR (${item.insumos.length} insumos)`}
                          </button>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            Para {item.cantidad} {item.cantidad > 1 ? 'porciones' : 'porción'}
                          </span>
                        </div>

                        {/* Detalle Desplegado de la Receta */}
                        {Boolean(expandedItems[item.detalle_id]) && (
                          <div style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: 6,
                            padding: '8px 10px',
                            fontSize: 11,
                            marginTop: 6
                          }}>
                            <div style={{ fontWeight: 800, color: '#0369a1', marginBottom: 4 }}>
                              ⚖️ Gramajes exactos para esta orden:
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 6 }}>
                              {item.insumos.map((ins, idx) => (
                                <div key={idx} style={{
                                  background: '#ffffff',
                                  padding: '4px 8px',
                                  borderRadius: 4,
                                  border: '1px solid #cbd5e1',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}>
                                  <span style={{ fontWeight: 600 }}>{ins.insumo}:</span>
                                  <strong style={{ color: '#0284c7' }}>
                                    {parseFloat(ins.cantidad_total).toFixed(3)} {ins.unidad}
                                  </strong>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Botones de acción por plato */}
                    <div style={{ display: 'flex', gap: 6, width: '100%', marginTop: 8 }}>
                      {item.estado_cocina === 'Pendiente' && (
                        <button
                          className="btn-kitch btn-kitch--start"
                          onClick={() => cambiarEstadoDetalle(item.detalle_id, 'Preparando')}
                        >
                          🔥 Empezar a preparar
                        </button>
                      )}
                      {item.estado_cocina === 'Preparando' && (
                        <button
                          className="btn-kitch btn-kitch--done"
                          onClick={() => cambiarEstadoDetalle(item.detalle_id, 'Despachado')}
                        >
                          ✅ Marcar como Listo
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════
         MODAL: LIBRO DE FICHAS TÉCNICAS & ESCANDALLOS EN KG/GR (100% RESPONSIVE)
         ═══════════════════════════════════════════════════════════ */}
      {showFichasModal && (
        <div className="pos-modal-overlay">
          <div className="pos-modal-card" style={{ width: '96%', maxWidth: 880, maxHeight: '92vh', overflowY: 'auto' }}>
            <div className="pos-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>📖</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16 }}>Fichas Técnicas & Escandallos Oficiales — Don Bigote</h3>
                  <small style={{ color: 'var(--text-muted)' }}>Recetario por porción en KG, GR, LT y cálculo dinámico de tandas</small>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowFichasModal(false)}>✕</button>
            </div>

            <div className="pos-modal-body" style={{ padding: '12px 16px' }}>
              {/* Buscador de Platos */}
              <div style={{ marginBottom: 12 }}>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="🔍 Buscar plato (ej: Ceviche, Parihuela, Chaufa, Arroz con Mariscos)..."
                  value={searchFicha}
                  onChange={(e) => setSearchFicha(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Lista de Platos y Ficha Detallada (Responsive Flex) */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                {/* Columna Izquierda: Menú */}
                <div style={{
                  flex: '1 1 260px',
                  minWidth: 230,
                  maxWidth: '100%',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  maxHeight: 380,
                  overflowY: 'auto',
                  background: '#f8fafc'
                }}>
                  {fichasRecetas
                    .filter(f => !searchFicha || f.nombre.toLowerCase().includes(searchFicha.toLowerCase()) || f.categoria.toLowerCase().includes(searchFicha.toLowerCase()))
                    .map((f) => (
                      <div
                        key={f.producto_id}
                        onClick={() => setFichaSeleccionada(f)}
                        style={{
                          padding: '10px 12px',
                          borderBottom: '1px solid #e2e8f0',
                          cursor: 'pointer',
                          background: fichaSeleccionada?.producto_id === f.producto_id ? '#e0f2fe' : 'transparent',
                          borderLeft: fichaSeleccionada?.producto_id === f.producto_id ? '4px solid #0284c7' : '4px solid transparent'
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy-900)' }}>{f.nombre}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          <span>{f.categoria}</span>
                          <span style={{ fontWeight: 700, color: '#0284c7' }}>S/ {parseFloat(f.precio).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Columna Derecha: Detalle de la Receta en KG/GR */}
                {fichaSeleccionada ? (
                  <div style={{
                    flex: '2 1 360px',
                    minWidth: 280,
                    maxWidth: '100%',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    padding: 14,
                    background: '#ffffff'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 16, color: 'var(--navy-900)' }}>{fichaSeleccionada.nombre}</h4>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          Categoría: {fichaSeleccionada.categoria} — Carta: S/ {parseFloat(fichaSeleccionada.precio).toFixed(2)}
                        </span>
                      </div>

                      {/* Calculadora de Porciones en Vivo */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f1f5f9', padding: '4px 8px', borderRadius: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>Tandas:</span>
                        {[1, 2, 4, 8].map(n => (
                          <button
                            key={n}
                            type="button"
                            className="btn-clear"
                            style={{
                              padding: '2px 8px',
                              fontSize: 11,
                              fontWeight: 800,
                              background: multiplicadorPorciones === n ? '#0284c7' : '#ffffff',
                              color: multiplicadorPorciones === n ? '#ffffff' : '#0f172a',
                              borderColor: multiplicadorPorciones === n ? '#0284c7' : '#cbd5e1'
                            }}
                            onClick={() => setMultiplicadorPorciones(n)}
                          >
                            {n}x
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <h5 style={{ margin: '0 0 8px 0', fontSize: 13, color: '#334155' }}>
                        🧂 Materia Prima e Insumos ({multiplicadorPorciones} {multiplicadorPorciones === 1 ? 'porción' : 'porciones'}):
                      </h5>

                      {(!fichaSeleccionada.ingredientes || fichaSeleccionada.ingredientes.length === 0) ? (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Este producto no requiere preparación en cocina (bebida o despacho directo).
                        </p>
                      ) : (
                        <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
                          <table className="users-table" style={{ fontSize: 12, minWidth: 380, width: '100%' }}>
                            <thead>
                              <tr>
                                <th>Insumo</th>
                                <th>Por 1 Porción</th>
                                <th style={{ color: '#0284c7' }}>Total para {multiplicadorPorciones}x</th>
                                <th>Stock Almacén</th>
                              </tr>
                            </thead>
                            <tbody>
                              {fichaSeleccionada.ingredientes.map((ing) => {
                                const cantTotal = Number(ing.cantidad_unitaria) * multiplicadorPorciones;
                                const bajoStock = ing.stock_actual < cantTotal;
                                return (
                                  <tr key={ing.insumo_id}>
                                    <td>
                                      <strong>{ing.nombre}</strong>
                                      {ing.es_critico && <span style={{ color: '#ef4444', fontSize: 10, marginLeft: 4 }}>[Crítico]</span>}
                                    </td>
                                    <td>{parseFloat(ing.cantidad_unitaria).toFixed(3)} {ing.unidad}</td>
                                    <td style={{ fontWeight: 800, color: '#0284c7', fontSize: 13 }}>
                                      {cantTotal.toFixed(3)} {ing.unidad}
                                    </td>
                                    <td>
                                      <span style={{
                                        padding: '2px 6px',
                                        borderRadius: 4,
                                        fontWeight: 700,
                                        fontSize: 11,
                                        background: bajoStock ? '#fee2e2' : '#dcfce7',
                                        color: bajoStock ? '#b91c1c' : '#15803d'
                                      }}>
                                        {parseFloat(ing.stock_actual).toFixed(2)} {ing.unidad}
                                        {bajoStock && ' ⚠️'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: '2 1 360px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px dashed #cbd5e1', borderRadius: 8, padding: 20 }}>
                    Selecciona un plato del menú a la izquierda para ver su receta en KG/GR.
                  </div>
                )}
              </div>
            </div>

            <div className="pos-modal-footer">
              <button className="btn-send" style={{ width: 'auto', padding: '8px 22px' }} onClick={() => setShowFichasModal(false)}>
                Cerrar Recetario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

