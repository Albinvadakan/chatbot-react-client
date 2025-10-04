import React from 'react';
import styles from '../styles/DashboardHome.module.css';

const stats = [
  { label: 'Chats Today', value: 54, icon: '�', color: '#43a047' },
  { label: 'Success Responses', value: 48, icon: '✅', color: '#1976d2' },
  { label: 'Inefficient Response', value: 5, icon: '❌', color: '#fbc02d' },
  { label: 'Files Uploaded', value: 1, icon: '📄', color: '#e53935' },
];

const DashboardHome = () => (
  <div className={styles.dashboardHome}>
    <h2>Dashboard Overview</h2>
    <div className={styles.statsRow}>
      {stats.map((stat, idx) => (
        <div className={styles.statCard} key={idx} style={{ borderColor: stat.color }}>
          <div className={styles.icon} style={{ color: stat.color }}>{stat.icon}</div>
          <div className={styles.value}>{stat.value}</div>
          <div className={styles.label}>{stat.label}</div>
        </div>
      ))}
    </div>
  </div>
);

export default DashboardHome;
