import React from 'react';
import styles from '../styles/LeftMenu.module.css';

const menuOptions = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'chat', label: 'Chat' },
  { key: 'upload', label: 'Upload' },
];

const LeftMenu = ({ activeMenu, setActiveMenu, onLogout }) => (
  <nav className={styles.leftMenu}>
    <ul>
      {menuOptions.map(option => (
        <li
          key={option.key}
          className={activeMenu === option.key ? styles.active : ''}
          onClick={() => setActiveMenu(option.key)}
        >
          {option.label}
        </li>
      ))}
    </ul>
  </nav>
);

export default LeftMenu;
