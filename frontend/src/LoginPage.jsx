import { useState } from 'react';
import axios from 'axios';
import CompanyLogo from './components/CompanyLogo';

const ROL_LABELS = {
  mesero: { label: 'Mesero', icon: '🧑‍🍽️' },
  cocina: { label: 'Cocina', icon: '👨‍🍳' },
  cajero: { label: 'Cajero', icon: '💰' },
  admin: { label: 'Administrador', icon: '⚙️' },
};

export default function LoginPage({ onLogin, apiBase }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!usuario || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { data } = await axios.post('/api/login', {
        usuario,
        password,
      });

      onLogin({
        token: data.token,
        usuario: data.usuario,
      });
    } catch (err) {
      const msg =
        err.response?.data?.error ??
        'Error de conexión. Verifica el servidor.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="login-bg">
      <div className="login-blob login-blob--1" />
      <div className="login-blob login-blob--2" />

      <div className="login-card">
        {/* Brand with logo image */}
        <div className="login-brand">
          <CompanyLogo className="login-logo-img" />
          <h1 className="login-title">La Sazón de<br /><span>Don Bigote</span></h1>
          <p className="login-subtitle">Sistema POS Marino & Restaurante</p>
        </div>

        {/* Roles pills */}
        <div className="login-roles">
          {Object.entries(ROL_LABELS).map(([key, { label, icon }]) => (
            <span key={key} className="role-pill">
              {icon} {label}
            </span>
          ))}
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="login-user">Usuario</label>
            <div className="input-wrap">
              <span className="input-icon">👤</span>
              <input
                id="login-user"
                type="text"
                placeholder="Ej: aless, sabi, mayra"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="login-pass">Contraseña</label>
            <div className="input-wrap">
              <span className="input-icon">🔒</span>
              <input
                id="login-pass"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-toggle-pass"
                onClick={() => setShowPass((v) => !v)}
                tabIndex={-1}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error" role="alert">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            id="btn-login-submit"
            className={`btn-login ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <span className="login-spinner" />
            ) : (
              '🔑 Ingresar al Sistema'
            )}
          </button>
        </form>

        <p className="login-footer">
          Don Bigote POS v2.0 &mdash; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
