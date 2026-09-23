'use client';

import { useState, useEffect, ReactNode } from 'react';

export default function AuthWrapper({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if already authenticated
    const isAuth = sessionStorage.getItem('authenticated') === 'true';
    setAuthenticated(isAuth);
    setLoading(false);
  }, []);

  const unlock = () => {
    if (password === 'rerereu') {
      sessionStorage.setItem('authenticated', 'true');
      setAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      unlock();
    }
  };

  if (loading) {
    return (
      <div className="login">
        <div className="loginbox">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="login">
        <div className="loginbox">
          <h1>BOL Seller Messenger</h1>
          <input
            type="password"
            placeholder="Workspace password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          {error && <p className="error" style={{ color: 'red', marginTop: '8px' }}>{error}</p>}
          <button onClick={unlock}>Unlock</button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
