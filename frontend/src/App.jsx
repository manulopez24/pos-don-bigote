import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';
import { socket } from './socket';
import LoginPage from './LoginPage';
import WaiterPOS from './WaiterPOS';
import KitchenView from './KitchenView';
import CashierView from './CashierView';
import AdminView from './AdminView';
import Navbar from './components/Navbar';

const API = '';

function RoleView({ user, onLogout }) {
  switch (user.rol) {
    case 'mesero': return <WaiterPOS user={user} onLogout={onLogout} />;
    case 'cocina': return <KitchenView user={user} onLogout={onLogout} />;
    case 'cajero': return <CashierView user={user} onLogout={onLogout} />;
    case 'admin': return <AdminView user={user} onLogout={onLogout} />;
    default:
      return (
        <div className="role-unknown">
          <p>Rol desconocido: <strong>{user.rol}</strong></p>
          <button className="btn-logout-plain" onClick={onLogout}>Cerrar sesión</button>
        </div>
      );
  }
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Usar sessionStorage para permitir múltiples cuentas en pestañas diferentes
  useEffect(() => {
    const token = sessionStorage.getItem('donbigote_token') || localStorage.getItem('donbigote_token');
    if (!token) { setLoading(false); return; }

    axios.get(`${API}/api/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(({ data }) => {
        setUser({ ...data.usuario, token });
      })
      .catch(() => {
        sessionStorage.removeItem('donbigote_token');
        localStorage.removeItem('donbigote_token');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('donbigote_token');
    localStorage.removeItem('donbigote_token');
    setUser(null);
  }, []);

  // WebSockets: Escuchar expulsión inmediata por administrador
  useEffect(() => {
    if (!user) return;

    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('unirse_sala', { rol: user.rol, usuario_id: user.id });

    const handleForzarLogout = ({ usuario_id }) => {
      if (user.id === usuario_id) {
        alert('⚠️ Tu cuenta ha sido desactivada o tu sesión ha sido revocada por el Administrador.');
        handleLogout();
      }
    };

    socket.on('FORZAR_LOGOUT_USUARIO', handleForzarLogout);

    return () => {
      socket.off('FORZAR_LOGOUT_USUARIO', handleForzarLogout);
    };
  }, [user, handleLogout]);

  const handleLogin = useCallback(({ token, usuario }) => {
    sessionStorage.setItem('donbigote_token', token);
    setUser({ ...usuario, token });
  }, []);

  if (loading) {
    return (
      <div className="app-splash">
        <div className="splash-logo">🐟</div>
        <p className="splash-text">Cargando Don Bigote POS...</p>
        <div className="splash-bar"><div className="splash-bar-inner" /></div>
      </div>
    );
  }

  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="pos-shell">
      <Navbar user={user} onLogout={handleLogout} />
      <RoleView user={user} onLogout={handleLogout} />
    </div>
  );
}

export default App;