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
  Section,
} from '@carbon/react';
import { Download, Printer } from '@carbon/react/icons';
import { usePatientChartStore } from '@arunkumar-reddy/esm-patient-common-lib';
import { showToast } from '@openmrs/esm-framework';
import { fetchPrintData } from './api/print-api';
import type { PrintData, Diagnosis, Observation, EncounterOrder } from './api/print-api';
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

  // Format date as DD/MM/YYYY HH:MM
  const formatGeneratedDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Format birth date as DD/MM/YYYY
  const formatBirthDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format datetime as DD/MM/YYYY HH:MM
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Format value for display
  const formatObservationValue = (obs: Observation) => {
    if (obs.value === null || obs.value === undefined) return '-';
    if (typeof obs.value === 'object' && obs.value.display) {
      return obs.value.display;
    }
    return String(obs.value);
  };

  // Get diagnosis display text
  const getDiagnosisDisplay = (diagnosis: Diagnosis) => {
    if (diagnosis.diagnosis?.coded?.display) {
      return diagnosis.diagnosis.coded.display;
    }
    if (diagnosis.diagnosis?.nonCoded) {
      return diagnosis.diagnosis.nonCoded;
    }
    return diagnosis.display || '-';
  };

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

  const { patient, visits, encounters, medications, allDiagnoses, allObservations, allOrders } = printData;

  // Helper to sort diagnoses by rank
  const sortedDiagnoses = [...allDiagnoses].sort((a, b) => a.rank - b.rank);

  return (
    <div className={styles.container}>
      <div id={containerId} className={styles.previewContent}>
        <h1 className={styles.title}>{t('patientInfo', 'Patient Information')}</h1>
        <p className={styles.generatedAt}>
          {t('generatedOn', 'Generated on: {{date}}', {
            date: formatGeneratedDate(printData.generatedAt),
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
              <strong>{t('birthDate', 'Birth Date')}:</strong> {formatBirthDate(patient.person.birthdate)}
            </p>
            {patient.identifiers
              .filter((identifier) => !identifier.display.includes('OpenMRS ID'))
              .map((identifier, index) => (
                <p key={index}>
                  <strong>{identifier.display}:</strong> {identifier.display}
                </p>
              ))}
          </div>
        </Tile>

        <Tile className={styles.card}>
          <h3>{t('mostRecentVisit', 'Most Recent Visit')}</h3>
          {visits.length > 0 ? (
            <div className={styles.tableContainer}>
              <DataTable
                rows={visits.map((v) => ({
                  id: v.uuid,
                  display: v.display,
                  type: v.visitType?.name || '-',
                  location: v.location?.display || '-',
                  start: formatDateTime(v.startDatetime),
                  end: v.stopDatetime ? formatDateTime(v.stopDatetime) : 'Ongoing',
                }))}
                headers={[
                  { key: 'type', header: t('visitType', 'Type') },
                  { key: 'location', header: t('location', 'Location') },
                  { key: 'start', header: t('startDate', 'Start Date') },
                  { key: 'end', header: t('endDate', 'End Date') },
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
            </div>
          ) : (
            <p className={styles.emptyState}>{t('noVisits', 'No visits recorded')}</p>
          )}
        </Tile>

        <Tile className={styles.card}>
          <h3>
            {t('diagnoses', 'Diagnoses')} ({sortedDiagnoses.length})
          </h3>
          {sortedDiagnoses.length > 0 ? (
            <div className={styles.tableContainer}>
              <DataTable
                rows={sortedDiagnoses.map((d) => ({
                  id: d.uuid,
                  rank: d.rank,
                  diagnosis: getDiagnosisDisplay(d),
                  certainty: d.certainty || '-',
                  voided: d.voided ? t('voided', 'Voided') : t('active', 'Active'),
                }))}
                headers={[
                  { key: 'rank', header: t('rank', 'Rank') },
                  { key: 'diagnosis', header: t('diagnosis', 'Diagnosis') },
                  { key: 'certainty', header: t('certainty', 'Certainty') },
                  { key: 'voided', header: t('status', 'Status') },
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
            </div>
          ) : (
            <p className={styles.emptyState}>{t('noDiagnoses', 'No diagnoses recorded')}</p>
          )}
        </Tile>

        <Tile className={styles.card}>
          <h3>
            {t('encounters', 'Encounters')} ({encounters.length})
          </h3>
          {encounters.length > 0 ? (
            <div className={styles.tableContainer}>
              <DataTable
                rows={encounters.map((e) => ({
                  id: e.uuid,
                  display: e.display,
                  type: e.encounterType?.display || '-',
                  form: e.form?.name || '-',
                  datetime: formatDateTime(e.encounterDatetime),
                }))}
                headers={[
                  { key: 'type', header: t('encounterType', 'Type') },
                  { key: 'form', header: t('form', 'Form') },
                  { key: 'datetime', header: t('dateTime', 'Date & Time') },
                  { key: 'display', header: t('encounterDisplay', 'Encounter') },
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
            </div>
          ) : (
            <p className={styles.emptyState}>{t('noEncounters', 'No encounters recorded')}</p>
          )}
        </Tile>

        <Tile className={styles.card}>
          <h3>
            {t('observations', 'Observations')} ({allObservations.length})
          </h3>
          {allObservations.length > 0 ? (
            <div className={styles.tableContainer}>
              <DataTable
                rows={allObservations.map((obs) => ({
                  id: obs.uuid,
                  concept: obs.concept.display,
                  value: formatObservationValue(obs),
                  datetime: formatDateTime(obs.obsDatetime),
                  groupMembers: obs.groupMembers?.length || 0,
                }))}
                headers={[
                  { key: 'concept', header: t('concept', 'Concept') },
                  { key: 'value', header: t('value', 'Value') },
                  { key: 'datetime', header: t('obsDatetime', 'Date & Time') },
                  { key: 'groupMembers', header: t('groupMembers', 'Group Members') },
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
            </div>
          ) : (
            <p className={styles.emptyState}>{t('noObservations', 'No observations recorded')}</p>
          )}
        </Tile>

        <Tile className={styles.card}>
          <h3>
            {t('orders', 'Orders')} ({allOrders.length})
          </h3>
          {allOrders.length > 0 ? (
            <div className={styles.tableContainer}>
              <DataTable
                rows={allOrders.map((order) => ({
                  id: order.uuid,
                  concept: order.concept?.display || t('unknown', 'Unknown'),
                  action: order.action,
                  urgency: order.urgency,
                  dateActivated: formatDateTime(order.dateActivated),
                  status: order.status || order.action,
                }))}
                headers={[
                  { key: 'concept', header: t('orderConcept', 'Concept') },
                  { key: 'action', header: t('action', 'Action') },
                  { key: 'urgency', header: t('urgency', 'Urgency') },
                  { key: 'dateActivated', header: t('dateActivated', 'Date Activated') },
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
            </div>
          ) : (
            <p className={styles.emptyState}>{t('noOrders', 'No orders recorded')}</p>
          )}
        </Tile>

        <Tile className={styles.card}>
          <h3>
            {t('medications', 'Medications')} ({medications.length})
          </h3>
          {medications.length > 0 ? (
            <div className={styles.tableContainer}>
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
            </div>
          ) : (
            <p className={styles.emptyState}>{t('noMedications', 'No medications prescribed')}</p>
          )}
        </Tile>
      </div>

      <div className={styles.actions} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Button onClick={handlePrintBrowser} disabled={generating} renderIcon={Printer}>
          {generating ? t('printing', 'Printing...') : t('printBrowser', 'Print (Browser)')}
        </Button>
        <Button onClick={handleDownloadPDF} disabled={generating} renderIcon={Download} kind="secondary">
          {t('downloadPdf', 'Download PDF')}
        </Button>
      </div>
    </div>
  );
};

export default PrintPreview;
