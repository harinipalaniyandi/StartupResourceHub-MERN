import React, { useState, useEffect } from 'react';

export default function ThemeSelector() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('srh_theme') || 'dark';
  });

  const applyTheme = (newTheme) => {
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('srh_theme', newTheme);
    setTheme(newTheme);
  };

  useEffect(() => {
    const saved = localStorage.getItem('srh_theme') || 'dark';
    const validTheme = saved === 'light' ? 'light' : 'dark';
    applyTheme(validTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  };

  return (
    <button
      className="theme-toggle-btn"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle Theme"
      type="button"
    >
      <span className="theme-btn-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
      <span className="theme-btn-text">{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  );
}
