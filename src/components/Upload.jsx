import React, { useState } from 'react';
import styles from '../styles/Upload.module.css';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a file to upload.');
      return;
    }
    // Simulate upload
    setTimeout(() => {
      setMessage(`File "${file.name}" uploaded successfully!`);
      setFile(null);
    }, 1000);
  };

  return (
    <div className={styles.uploadContainer}>
      <h2>Upload File</h2>
      <form className={styles.uploadForm} onSubmit={handleSubmit}>
        <input
          type="file"
          onChange={handleFileChange}
          className={styles.fileInput}
        />
        <button type="submit" className={styles.uploadBtn}>Upload</button>
      </form>
      {message && <div className={styles.message}>{message}</div>}
    </div>
  );
};

export default Upload;
