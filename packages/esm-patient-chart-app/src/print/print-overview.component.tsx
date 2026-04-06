import React from 'react';
import { Tile, Stack } from '@carbon/react';
import PrintPreview from './print-preview.component';

interface PrintOverviewProps {
  patientUuid: string;
}

const PrintOverview: React.FC<PrintOverviewProps> = ({ patientUuid }) => {
  if (!patientUuid) {
    console.warn('❌ No patientUuid provided');
    return (
      <Tile>
        <h3>Print Overview</h3>
        <p>Error: No patient UUID found</p>
      </Tile>
    );
  }

  // The onClose handler is a no-op for the dashboard view since we're not in a modal/workspace
  return (
    <Stack gap={4}>
      <Tile>
        <h3>🖨️ Print Overview - Hello World</h3>
        <p>Component rendered successfully!</p>
        <p>Patient UUID: {patientUuid}</p>
      </Tile>
      <PrintPreview patientUuid={patientUuid} onClose={() => {}} />
    </Stack>
  );
};

export default PrintOverview;
