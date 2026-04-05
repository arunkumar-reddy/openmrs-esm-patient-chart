import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { launchWorkspace2 } from '@openmrs/esm-framework';
import PrintPreview from './print-preview.component';
import styles from './print-view.scss';

const PrintView: React.FC = () => {
  const { t } = useTranslation();
  const { patientUuid } = useParams<{ patientUuid: string }>();

  const handleOpenWorkspace = () => {
    if (patientUuid) {
      launchWorkspace2('print-workspace', {});
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{t('printPatientInfo', 'Print Patient Info')}</h1>
        <button onClick={handleOpenWorkspace} className={styles.launchButton}>
          {t('launchPrintWorkspace', 'Launch Print')}
        </button>
      </div>
      <div className={styles.content}>
        {patientUuid && <PrintPreview patientUuid={patientUuid} onClose={() => {}} />}
      </div>
    </div>
  );
};

export default PrintView;
