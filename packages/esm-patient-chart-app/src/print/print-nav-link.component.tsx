import React from 'react';
import { useTranslation } from 'react-i18next';
import { launchWorkspace } from '@openmrs/esm-framework';
import styles from './print-nav-link.scss';

const PrintNavLink: React.FC = () => {
  const { t } = useTranslation();

  const handlePrint = () => {
    launchWorkspace('print-workspace');
  };

  return (
    <div className={styles.navItem}>
      <button className={styles.navLink} onClick={handlePrint} title={t('printPatientInfo', 'Print Patient Info')}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          width="16"
          height="16"
          viewBox="0 0 32 32"
          className={styles.icon}
        >
          <path d="M26 6V2H6v4H2v14h4v8h20v-8h4V6h-4zM8 4h16v2H8V4zm16 22H8v-6h16v6zm2-8H6V8h20v10z"></path>
          <path d="M14 16h4v6h-4z"></path>
        </svg>
        <span>{t('printPatientInfo', 'Print Patient Info')}</span>
      </button>
    </div>
  );
};

export default PrintNavLink;
