import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Tile,
  InlineLoading,
  Layer,
  Stack,
} from '@carbon/react';
import { Download, Printer } from '@carbon/react/icons';
import { usePatientChartStore } from '@arunkumar-reddy/esm-patient-common-lib';
import { showToast } from '@openmrs/esm-framework';
import { fetchPrintData } from './api/print-api';
import type { PrintData } from './api/print-api';
import { PDFGenerator, printViaBrowser, generatePrintableHTML } from './generator/print-generator';
import styles from './print-preview.scss';

interface PrintPreviewProps {
  patientUuid: string;
  onClose: () => void;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ patientUuid, onClose }) => {
  const { t } = useTranslation();
  const [printData, setPrintData] = useState<PrintData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const containerId = 'print-preview-container';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPrintData(patientUuid);
      setPrintData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      showToast({
        kind: 'error',
        title: t('errorFetchingData', 'Error fetching data: {{error}}', { error: errorMessage }),
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [patientUuid, t]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrintBrowser = async () => {
    if (!printData) return;

    setGenerating(true);
    try {
      const html = await generatePrintableHTML(printData);

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Unable to open print window');
      }

      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        setGenerating(false);
      }, 250);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Print failed';
      showToast({
        kind: 'error',
        title: errorMessage,
        description: errorMessage,
      });
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!printData) return;

    setGenerating(true);
    try {
      const generator = new PDFGenerator();
      const pdf = generator.generatePDF(printData);
      pdf.save(`patient-info-${patientUuid}.pdf`);
      showToast({
        kind: 'success',
        title: t('downloadPdf', 'PDF downloaded successfully'),
        description: t('downloadPdf', 'PDF downloaded successfully'),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'PDF generation failed';
      showToast({
        kind: 'error',
        title: errorMessage,
        description: errorMessage,
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <InlineLoading description={t('loading', 'Loading...')} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>{t('errorFetchingData', 'Error fetching data: {{error}}', { error })}</p>
        <Button onClick={loadData}>{t('retry', 'Retry')}</Button>
        <Button kind="secondary" onClick={onClose}>
          {t('cancel', 'Cancel')}
        </Button>
      </div>
    );
  }

  if (!printData) {
    return null;
  }

  const { patient, visits, encounters, medications } = printData;

  return (
    <div className={styles.container}>
      <div id={containerId} className={styles.previewContent}>
        <h1 className={styles.title}>{t('patientInfo', 'Patient Information')}</h1>
        <p className={styles.generatedAt}>
          {t('generatedOn', 'Generated on: {{date}}', {
            date: new Date(printData.generatedAt).toLocaleString(),
          })}
        </p>

        <Tile className={styles.card}>
          <h3>{t('patientDetails', 'Patient Details')}</h3>
          <div className={styles.patientInfo}>
            <p>
              <strong>{t('name', 'Name')}:</strong> {patient.display}
            </p>
            <p>
              <strong>{t('gender', 'Gender')}:</strong> {patient.person.gender}
            </p>
            <p>
              <strong>{t('age', 'Age')}:</strong> {patient.person.age}
            </p>
            <p>
              <strong>{t('birthDate', 'Birth Date')}:</strong> {patient.person.birthdate}
            </p>
            {patient.identifiers.map((identifier, index) => (
              <p key={index}>
                <strong>{identifier.identifierType.display}:</strong> {identifier.identifier}
              </p>
            ))}
          </div>
        </Tile>

        <Tile className={styles.card}>
          <h3>
            {t('visits', 'Visits')} ({visits.length})
          </h3>
          {visits.length > 0 ? (
            <DataTable
              rows={visits.map((v) => ({
                id: v.uuid,
                type: v.visitType.display,
                location: v.location.display,
                startDate: new Date(v.startDatetime).toLocaleDateString(),
                endDate: v.stopDatetime ? new Date(v.stopDatetime).toLocaleDateString() : t('active', 'Active'),
              }))}
              headers={[
                { key: 'type', header: t('visitType', 'Visit Type') },
                { key: 'location', header: t('location', 'Location') },
                { key: 'startDate', header: t('startDate', 'Start Date') },
                { key: 'endDate', header: t('endDate', 'End Date') },
              ]}
            >
              {({ rows, headers, getHeaderProps, getRowProps }) => (
                <Table>
                  <TableHead>
                    <TableRow>
                      {headers.map((header) => (
                        <TableHeader key={header.key} {...getHeaderProps({ header })}>
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id} {...getRowProps({ row })}>
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id}>{cell.value}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </DataTable>
          ) : (
            <p className={styles.emptyState}>{t('noVisits', 'No visits recorded')}</p>
          )}
        </Tile>

        <Tile className={styles.card}>
          <h3>
            {t('encounters', 'Encounters')} ({encounters.length})
          </h3>
          {encounters.length > 0 ? (
            <DataTable
              rows={encounters.map((e) => ({
                id: e.uuid,
                type: e.encounterType.display,
                date: new Date(e.encounterDatetime).toLocaleDateString(),
              }))}
              headers={[
                { key: 'type', header: t('encounterType', 'Encounter Type') },
                { key: 'date', header: t('date', 'Date') },
              ]}
            >
              {({ rows, headers, getHeaderProps, getRowProps }) => (
                <Table>
                  <TableHead>
                    <TableRow>
                      {headers.map((header) => (
                        <TableHeader key={header.key} {...getHeaderProps({ header })}>
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id} {...getRowProps({ row })}>
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id}>{cell.value}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </DataTable>
          ) : (
            <p className={styles.emptyState}>{t('noEncounters', 'No encounters recorded')}</p>
          )}
        </Tile>

        <Tile className={styles.card}>
          <h3>
            {t('medications', 'Medications')} ({medications.length})
          </h3>
          {medications.length > 0 ? (
            <DataTable
              rows={medications.map((m) => ({
                id: m.uuid,
                medication: m.concept?.display || t('unknown', 'Unknown'),
                dosage: m.dosage || '-',
                started: new Date(m.dateActivated).toLocaleDateString(),
                status: m.status,
              }))}
              headers={[
                { key: 'medication', header: t('medication', 'Medication') },
                { key: 'dosage', header: t('dosage', 'Dosage') },
                { key: 'started', header: t('started', 'Started') },
                { key: 'status', header: t('status', 'Status') },
              ]}
            >
              {({ rows, headers, getHeaderProps, getRowProps }) => (
                <Table>
                  <TableHead>
                    <TableRow>
                      {headers.map((header) => (
                        <TableHeader key={header.key} {...getHeaderProps({ header })}>
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id} {...getRowProps({ row })}>
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id}>{cell.value}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </DataTable>
          ) : (
            <p className={styles.emptyState}>{t('noMedications', 'No medications prescribed')}</p>
          )}
        </Tile>
      </div>

      <div className={styles.actions}>
        <Stack gap={3}>
          <Button onClick={handlePrintBrowser} disabled={generating} renderIcon={Printer}>
            {generating ? t('printing', 'Printing...') : t('printBrowser', 'Print (Browser)')}
          </Button>
          <Button onClick={handleDownloadPDF} disabled={generating} renderIcon={Download} kind="secondary">
            {t('downloadPdf', 'Download PDF')}
          </Button>
          <Button onClick={onClose} kind="tertiary">
            {t('cancel', 'Cancel')}
          </Button>
        </Stack>
      </div>
    </div>
  );
};

export default PrintPreview;
