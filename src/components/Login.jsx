import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css'; 

export default function Login({ onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth(); 

  // CATCH THE SECRET MESSAGE FROM HOME.JSX
  const customMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Call your backend login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Login failed');

      // Save token AND the user's name!
      localStorage.setItem('token', data.token);
      // Assuming your backend sends the user object like: { token: '...', user: { name: 'Jalak', ... } }
      localStorage.setItem('userName', data.user.name); 
      
      login(data.token); 
      navigate('/dashboard');
      
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Welcome Back</h2>
        
        {/* DISPLAY THE CUSTOM MESSAGE FROM THE HOME PAGE */}
        {customMessage && (
          <div className="alert-message success-alert">
            {customMessage}
          </div>
        )}

        {/* Display standard errors */}
        {error && <div className="alert-message error-alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          <button type="submit" className="btn-primary w-full">Sign In</button>
        </form>

        <p className="switch-prompt">
          Don't have an account?{' '}
          <button className="btn-text" onClick={onSwitchToRegister}>
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}