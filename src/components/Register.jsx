import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css'; // We can reuse the exact same CSS file!

export default function Register({ onSwitchToLogin }) {
  const [name, setName] = useState(''); // Added Name field!
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Send Name, Email, and Password to your backend
      const response = await fetch('https://image-generator-bzub.onrender.com/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }) 
      });

      const text = await response.text();
const data = text ? JSON.parse(text) : {};

      if (!response.ok) throw new Error(data.message || 'Registration failed');

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
        <h2>Create Account</h2>
        
        {error && <div className="alert-message error-alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </div>
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
            <label>Password (Min 6 characters)</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              minLength="6"
            />
          </div>
          
          <button type="submit" className="btn-primary w-full">Sign Up</button>
        </form>

        <p className="switch-prompt">
          Already have an account?{' '}
          <button className="btn-text" onClick={onSwitchToLogin}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}