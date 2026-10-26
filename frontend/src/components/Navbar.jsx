import { useState, useEffect } from 'react';
import CompanyLogo from './CompanyLogo';

function useClock() {
  const [clock, setClock] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('es-PE', {
        hour: '2-digit', minute: '2-digit'
      }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return clock;
}

const ROL_INFO = {
  mesero: { label: 'Mesero',   color: '#00b4d8', icon: '🧑‍🍽️' },
  cocina: { label: 'Cocina',   color: '#f97316', icon: '👨‍🍳' },
  cajero: { label: 'Cajero',   color: '#10b981', icon: '💰'   },
  admin:  { label: 'Admin',    color: '#a855f7', icon: '⚙️'   },
};

export default function Navbar({ user, onLogout }) {
  const clock = useClock();
  const info  = ROL_INFO[user.rol] ?? { label: user.rol, color: '#fff', icon: '👤' };

  return (
    <header className="pos-header">
      {/* Brand Logo & Name */}
      <div className="pos-header__logo">
        <CompanyLogo className="header-logo-img" />
        <div className="header-brand-wrap">
          <h1 className="header-brand-title">
            <span className="brand-hide-mobile">La Sazón de </span>
            <span className="brand-gold">Don Bigote</span>
          </h1>
        </div>
      </div>

      {/* User Info */}
      <div className="navbar-user-card">
        <div className="nuc-avatar" style={{ border: `1.5px solid ${info.color}` }}>
          <span>{info.icon}</span>
        </div>
        <div className="nuc-details">
          <span className="nuc-name">{user.nombre.split(' ')[0]}</span>
          <span className="nuc-role-badge" style={{ color: info.color }}>
            {info.label}
          </span>
        </div>
      </div>

      {/* Clock & Logout */}
      <div className="pos-header__right">
        <div className="pos-header__clock">
          <span className="clock-pulse" />
          <span>{clock}</span>
        </div>
        <button
          id="btn-logout"
          className="btn-logout-premium"
          onClick={onLogout}
          title="Cerrar sesión"
        >
          <span className="btn-logout-icon">⏻</span>
          <span className="btn-logout-label">Salir</span>
        </button>
      </div>
    </header>
  );
}
