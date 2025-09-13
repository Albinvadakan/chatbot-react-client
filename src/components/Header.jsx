
import styles from '../styles/Header.module.css';

import hospitalLogo from '../assets/hospital-logo.svg';

import userIcon from '../assets/user-icon.svg';


const Header = ({ onLogout, username }) => (
  <header className={styles.header}>
    <div className={styles.left}>
      <img src={hospitalLogo} alt="Hospital Logo" className={styles.hospitalLogo} />
      <span className={styles.title}>KNH Hospital</span>
    </div>
    {onLogout && (
      <div className={styles.headerRight}>
        <span className={styles.userSection}>
          <img src={userIcon} alt="User" className={styles.userIcon} />
          <span className={styles.username}>{username}</span>
        </span>
        <button className={styles.logoutBtn} onClick={onLogout}>
          Logout
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" style={{marginLeft: '0.5rem'}}><path fill="#1976d2" d="M7 12a1 1 0 0 1 1-1h7.59l-2.3-2.29a1 1 0 1 1 1.42-1.42l4 4a1 1 0 0 1 0 1.42l-4 4a1 1 0 1 1-1.42-1.42L15.59 13H8a1 1 0 0 1-1-1z"/></svg>
        </button>
      </div>
    )}
  </header>
);

export default Header;
