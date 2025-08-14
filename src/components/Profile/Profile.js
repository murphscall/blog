import React from 'react';
import { FaGithub, FaEnvelope } from 'react-icons/fa';
import * as styles from './profile.module.css';

const Profile = () => {
  return (
    <section className={styles.profileSection}>
      <div className={styles.profileImage} aria-label="Profile Picture"></div>
      <div className={styles.contentWrapper}>
        <h2 className={styles.name}>JeDev</h2>
        <p className={styles.description}>
          안녕하세요 꾸준히 기록하는 개발자입니다.
        </p>
        <div className={styles.links}>
          <a href="https://github.com/murphscall" target="_blank" rel="noopener noreferrer" aria-label="GitHub Profile">
            <FaGithub size={24} />
          </a>
          <a href="mailto:wlsgnwkd22@gmail.com" aria-label="Email Address">
            <FaEnvelope size={24} />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Profile;