import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { PrintData, Patient, Visit, Encounter, MedicationOrder } from '../api/print-api';

export class PDFGenerator {
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
  }

  private formatDateDDMMYY(dateString: string): string {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  }

  private formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  private getDiagnosisDisplay(diagnosis: any): string {
    if (diagnosis.diagnosis?.coded?.display) {
      return diagnosis.diagnosis.coded.display;
    }
    if (diagnosis.diagnosis?.nonCoded) {
      return diagnosis.diagnosis.nonCoded;
    }
    return diagnosis.display || '-';
  }

  private formatObservationValue(obs: any): string {
    if (obs.value === null || obs.value === undefined) return '-';
    if (typeof obs.value === 'object' && obs.value.display) {
      return obs.value.display;
    }
    return String(obs.value);
  }

  generatePDF(printData: PrintData): jsPDF {
    const { patient, visits, encounters, medications, allDiagnoses, allObservations, allOrders, generatedAt } =
      printData;

    this.doc.setFontSize(20);
    this.doc.text('Patient Information', 14, 20);

    this.doc.setFontSize(12);
    // Format date as DD/MM/YYYY HH:MM
    const date = new Date(generatedAt);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;
    this.doc.text(`Generated on: ${formattedDate}`, 14, 30);

    this.addPatientSection(patient);
    this.addVisitsSection(visits);
    this.addDiagnosesSection(allDiagnoses);
    this.addEncountersSection(encounters);
    this.addObservationsSection(allObservations);
    this.addOrdersSection(allOrders);
    this.addMedicationsSection(medications);

    return this.doc;
  }

  private addPatientSection(patient: Patient) {
    this.doc.setFontSize(14);
    this.doc.text('Patient Details', 14, 40);

    this.doc.setFontSize(10);
    const startY = 45;
    let yPos = startY;

    this.doc.text(`Name: ${patient.display}`, 8, yPos);
    yPos += 6;

    this.doc.text(`Gender: ${patient.person.gender}`, 8, yPos);
    yPos += 6;

    this.doc.text(`Age: ${patient.person.age}`, 8, yPos);
    yPos += 6;

    // Format birth date as DD/MM/YYYY
    const birthDate = new Date(patient.person.birthdate);
    const formattedBirthDate = `${String(birthDate.getDate()).padStart(2, '0')}/${String(birthDate.getMonth() + 1).padStart(2, '0')}/${birthDate.getFullYear()}`;
    this.doc.text(`Birth Date: ${formattedBirthDate}`, 8, yPos);
    yPos += 6;

    // Display identifiers excluding OpenMRS ID
    patient.identifiers.forEach((identifier) => {
      if (!identifier.display.includes('OpenMRS ID')) {
        this.doc.text(`${identifier.display}`, 8, yPos);
        yPos += 6;
      }
    });

    this.doc.addPage();
  }

  private addVisitsSection(visits: Visit[]) {
    this.doc.setFontSize(14);
    this.doc.text('Most Recent Visit', 14, 20);

    this.doc.setFontSize(10);
    let yPos = 25;

    visits.forEach((visit, index) => {
      if (index > 0 && yPos > 250) {
        this.doc.addPage();
        yPos = 20;
      }

      this.doc.text(`Visit Type: ${visit.visitType?.name || '-'}`, 14, yPos);
      yPos += 6;
      this.doc.text(`Location: ${visit.location?.display || '-'}`, 14, yPos);
      yPos += 6;
      this.doc.text(`Start: ${this.formatDateTime(visit.startDatetime)}`, 14, yPos);
      yPos += 6;
      this.doc.text(`End: ${visit.stopDatetime ? this.formatDateTime(visit.stopDatetime) : 'Ongoing'}`, 14, yPos);
      yPos += 6;

      yPos += 4;
    });

    this.doc.addPage();
  }

  private addDiagnosesSection(diagnoses: any[]) {
    this.doc.setFontSize(14);
    this.doc.text('Diagnoses', 14, 20);

    this.doc.setFontSize(10);
    let yPos = 25;

    // Sort diagnoses by rank
    const sortedDiagnoses = [...diagnoses].sort((a, b) => a.rank - b.rank);

    if (sortedDiagnoses.length === 0) {
      this.doc.text('No diagnoses recorded', 14, yPos);
      this.doc.addPage();
      return;
    }

    sortedDiagnoses.forEach((diagnosis, index) => {
      if (index > 0 && yPos > 250) {
        this.doc.addPage();
        yPos = 20;
      }

      const diagnosisText = this.getDiagnosisDisplay(diagnosis);
      this.doc.text(`Rank ${diagnosis.rank}: ${diagnosisText}`, 14, yPos);
      yPos += 6;
      this.doc.text(`  Certainty: ${diagnosis.certainty || '-'}`, 14, yPos);
      yPos += 6;
      this.doc.text(`  Status: ${diagnosis.voided ? 'Voided' : 'Active'}`, 14, yPos);
      yPos += 6;

      yPos += 2;
    });

    this.doc.addPage();
  }

  private addEncountersSection(encounters: Encounter[]) {
    this.doc.setFontSize(14);
    this.doc.text('Encounters', 14, 20);

    this.doc.setFontSize(10);
    let yPos = 25;

    if (encounters.length === 0) {
      this.doc.text('No encounters recorded', 14, yPos);
      this.doc.addPage();
      return;
    }

    encounters.forEach((encounter, index) => {
      if (index > 0 && yPos > 250) {
        this.doc.addPage();
        yPos = 20;
      }

      this.doc.text(`Type: ${encounter.encounterType?.display || '-'}`, 14, yPos);
      yPos += 6;
      this.doc.text(`Form: ${encounter.form?.name || '-'}`, 14, yPos);
      yPos += 6;
      this.doc.text(`Date: ${this.formatDateTime(encounter.encounterDatetime)}`, 14, yPos);
      yPos += 6;
      this.doc.text(`Display: ${encounter.display}`, 14, yPos);
      yPos += 6;

      yPos += 4;
    });

    this.doc.addPage();
  }

  private addObservationsSection(observations: any[]) {
    this.doc.setFontSize(14);
    this.doc.text('Observations', 14, 20);

    this.doc.setFontSize(10);
    let yPos = 25;

    if (observations.length === 0) {
      this.doc.text('No observations recorded', 14, yPos);
      this.doc.addPage();
      return;
    }

    observations.forEach((obs, index) => {
      if (index > 0 && yPos > 250) {
        this.doc.addPage();
        yPos = 20;
      }

      this.doc.text(`Concept: ${obs.concept.display}`, 14, yPos);
      yPos += 6;
      this.doc.text(`Value: ${this.formatObservationValue(obs)}`, 14, yPos);
      yPos += 6;
      this.doc.text(`Date: ${this.formatDateTime(obs.obsDatetime)}`, 14, yPos);
      yPos += 6;
      if (obs.groupMembers && obs.groupMembers.length > 0) {
        this.doc.text(`  Group Members: ${obs.groupMembers.length}`, 14, yPos);
        yPos += 6;
      }

      yPos += 2;
    });

    this.doc.addPage();
  }

  private addOrdersSection(orders: any[]) {
    this.doc.setFontSize(14);
    this.doc.text('Orders', 14, 20);

    this.doc.setFontSize(10);
    let yPos = 25;

    if (orders.length === 0) {
      this.doc.text('No orders recorded', 14, yPos);
      this.doc.addPage();
      return;
    }

    orders.forEach((order, index) => {
      if (index > 0 && yPos > 250) {
        this.doc.addPage();
        yPos = 20;
      }

      this.doc.text(`Concept: ${order.concept?.display || 'Unknown'}`, 14, yPos);
      yPos += 6;
      this.doc.text(`Action: ${order.action}`, 14, yPos);
      yPos += 6;
      this.doc.text(`Urgency: ${order.urgency}`, 14, yPos);
      yPos += 6;
      this.doc.text(`Date Activated: ${this.formatDateTime(order.dateActivated)}`, 14, yPos);
      yPos += 6;
      this.doc.text(`Status: ${order.status || order.action}`, 14, yPos);
      yPos += 6;

      yPos += 2;
    });

    this.doc.addPage();
  }

  private addMedicationsSection(medications: MedicationOrder[]) {
    this.doc.setFontSize(14);
    this.doc.text('Medications', 14, 20);

    this.doc.setFontSize(10);
    let yPos = 25;

    medications.forEach((medication, index) => {
      if (index > 0 && yPos > 250) {
        this.doc.addPage();
        yPos = 20;
      }

      this.doc.text(`Medication: ${medication.concept?.display || 'Unknown'}`, 14, yPos);
      yPos += 6;

      if (medication.dosage) {
        this.doc.text(`Dosage: ${medication.dosage}`, 14, yPos);
        yPos += 6;
      }

      this.doc.text(`Started: ${new Date(medication.dateActivated).toLocaleDateString()}`, 14, yPos);
      yPos += 6;

      yPos += 4;
    });
  }

  savePDF(filename: string): void {
    this.doc.save(filename);
  }
}

export async function printViaBrowser(elementId: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Print element not found');
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Unable to open print window');
  }

  const imgData = canvas.toDataURL('image/png');
  printWindow.document.write(`
    <html>
      <head>
        <title>Print Patient Info</title>
        <style>
          body { margin: 0; padding: 20px; }
          img { max-width: 100%; }
        </style>
      </head>
      <body>
        <img src="${imgData}" alt="Patient Info" />
        <script>
          window.onload = function() {
            window.print();
            window.close();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export async function generatePrintableHTML(printData: PrintData): Promise<string> {
  const { patient, visits, encounters, medications, allDiagnoses, allObservations, allOrders, generatedAt } = printData;

  // Helper functions
  const formatDateTime = (dateString: string) => {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const formatBirthDate = (dateString: string) => {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getDiagnosisDisplay = (diagnosis: any) => {
    if (diagnosis.diagnosis?.coded?.display) {
      return diagnosis.diagnosis.coded.display;
    }
    if (diagnosis.diagnosis?.nonCoded) {
      return diagnosis.diagnosis.nonCoded;
    }
    return diagnosis.display || '-';
  };

  const formatObservationValue = (obs: any) => {
    if (obs.value === null || obs.value === undefined) return '-';
    if (typeof obs.value === 'object' && obs.value.display) {
      return obs.value.display;
    }
    return String(obs.value);
  };

  // Sort diagnoses by rank
  const sortedDiagnoses = [...allDiagnoses].sort((a, b) => a.rank - b.rank);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Patient Information</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          h1 {
            color: #000;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          h2 {
            color: #444;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
          }
          .patient-info {
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          .meta-info {
            font-size: 12px;
            color: #666;
            margin-top: 30px;
          }
          .empty-state {
            color: #666;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <h1>Patient Information</h1>
        <p>Generated on: ${formatDateTime(generatedAt)}</p>
        
        <div class="section">
          <h2>Patient Details</h2>
          <div class="patient-info">
            <p><strong>Name:</strong> ${patient.display}</p>
            <p><strong>Gender:</strong> ${patient.person.gender}</p>
            <p><strong>Age:</strong> ${patient.person.age}</p>
            <p><strong>Birth Date:</strong> ${formatBirthDate(patient.person.birthdate)}</p>
            ${patient.identifiers
              .filter((id) => !id.display.includes('OpenMRS ID'))
              .map((id) => `<p><strong>${id.display}:</strong> ${id.display}</p>`)
              .join('')}
          </div>
        </div>

        <div class="section">
          <h2>Most Recent Visit</h2>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Location</th>
                <th>Start Date</th>
                <th>End Date</th>
              </tr>
            </thead>
            <tbody>
              ${
                visits.length > 0
                  ? visits
                      .map(
                        (visit) => `
                <tr>
                  <td>${visit.visitType?.name || '-'}</td>
                  <td>${visit.location?.display || '-'}</td>
                  <td>${formatDateTime(visit.startDatetime)}</td>
                  <td>${visit.stopDatetime ? formatDateTime(visit.stopDatetime) : 'Ongoing'}</td>
                </tr>
              `,
                      )
                      .join('')
                  : '<tr><td colspan="4" class="empty-state">No visits recorded</td></tr>'
              }
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Diagnoses (${sortedDiagnoses.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Diagnosis</th>
                <th>Certainty</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${
                sortedDiagnoses.length > 0
                  ? sortedDiagnoses
                      .map(
                        (diagnosis) => `
                <tr>
                  <td>${diagnosis.rank}</td>
                  <td>${getDiagnosisDisplay(diagnosis)}</td>
                  <td>${diagnosis.certainty || '-'}</td>
                  <td>${diagnosis.voided ? 'Voided' : 'Active'}</td>
                </tr>
              `,
                      )
                      .join('')
                  : '<tr><td colspan="4" class="empty-state">No diagnoses recorded</td></tr>'
              }
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Encounters (${encounters.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Form</th>
                <th>Date & Time</th>
                <th>Display</th>
              </tr>
            </thead>
            <tbody>
              ${
                encounters.length > 0
                  ? encounters
                      .map(
                        (encounter) => `
                <tr>
                  <td>${encounter.encounterType?.display || '-'}</td>
                  <td>${encounter.form?.name || '-'}</td>
                  <td>${formatDateTime(encounter.encounterDatetime)}</td>
                  <td>${encounter.display}</td>
                </tr>
              `,
                      )
                      .join('')
                  : '<tr><td colspan="4" class="empty-state">No encounters recorded</td></tr>'
              }
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Observations (${allObservations.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Concept</th>
                <th>Value</th>
                <th>Date & Time</th>
                <th>Group Members</th>
              </tr>
            </thead>
            <tbody>
              ${
                allObservations.length > 0
                  ? allObservations
                      .map(
                        (obs) => `
                <tr>
                  <td>${obs.concept.display}</td>
                  <td>${formatObservationValue(obs)}</td>
                  <td>${formatDateTime(obs.obsDatetime)}</td>
                  <td>${obs.groupMembers?.length || 0}</td>
                </tr>
              `,
                      )
                      .join('')
                  : '<tr><td colspan="4" class="empty-state">No observations recorded</td></tr>'
              }
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Orders (${allOrders.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Concept</th>
                <th>Action</th>
                <th>Urgency</th>
                <th>Date Activated</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${
                allOrders.length > 0
                  ? allOrders
                      .map(
                        (order) => `
                <tr>
                  <td>${order.concept?.display || 'Unknown'}</td>
                  <td>${order.action}</td>
                  <td>${order.urgency}</td>
                  <td>${formatDateTime(order.dateActivated)}</td>
                  <td>${order.status || order.action}</td>
                </tr>
              `,
                      )
                      .join('')
                  : '<tr><td colspan="5" class="empty-state">No orders recorded</td></tr>'
              }
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Medications (${medications.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Medication</th>
                <th>Dosage</th>
                <th>Started</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${
                medications.length > 0
                  ? medications
                      .map(
                        (med) => `
                <tr>
                  <td>${med.concept?.display || 'Unknown'}</td>
                  <td>${med.dosage || '-'}</td>
                  <td>${new Date(med.dateActivated).toLocaleDateString()}</td>
                  <td>${med.status}</td>
                </tr>
              `,
                      )
                      .join('')
                  : '<tr><td colspan="4" class="empty-state">No medications prescribed</td></tr>'
              }
            </tbody>
          </table>
        </div>

        <div class="meta-info">
          <p>Printed from OpenMRS Patient Chart</p>
        </div>
      </body>
    </html>
  `;
}
