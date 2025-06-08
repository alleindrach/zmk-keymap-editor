import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './i18n/i18n' // 必须在其他组件之前导入
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('app-root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
