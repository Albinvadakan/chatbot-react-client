import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LeftMenu from '../components/LeftMenu';
import Chat from '../components/Chat';
import Upload from '../components/Upload';
import DashboardHome from '../components/DashboardHome';
import styles from '../styles/Dashboard.module.css';


const Dashboard = ({ onLogout, username }) => {
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <DashboardHome />;
      case 'chat':
        return <Chat />;
      case 'upload':
        return <Upload />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <Header onLogout={onLogout} username={username} />
      <div className={styles.mainContent}>
        <LeftMenu activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
        <div className={styles.rightPane}>{renderContent()}</div>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
