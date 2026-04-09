import React from 'react';
import PrintPreview from './print-preview.component';

interface PrintOverviewProps {
  patientUuid: string;
}

const PrintOverview: React.FC<PrintOverviewProps> = ({ patientUuid }) => {
  if (!patientUuid) {
    console.warn('❌ No patientUuid provided');
    return null;
  }

  return <PrintPreview patientUuid={patientUuid} onClose={() => {}} />;
};

export default PrintOverview;
