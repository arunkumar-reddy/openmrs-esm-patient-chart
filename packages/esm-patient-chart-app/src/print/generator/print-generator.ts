import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { PrintData, Patient, Visit, Encounter, Order } from '../api/print-api';

export class PDFGenerator {
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
  }

  generatePDF(printData: PrintData): jsPDF {
    const { patient, visits, encounters, medications, generatedAt } = printData;

    this.doc.setFontSize(20);
    this.doc.text('Patient Information', 14, 20);

    this.doc.setFontSize(12);
    this.doc.text(`Generated on: ${new Date(generatedAt).toLocaleString()}`, 14, 30);

    this.addPatientSection(patient);
    this.addVisitsSection(visits);
    this.addEncountersSection(encounters);
    this.addMedicationsSection(medications);

    return this.doc;
  }

  private addPatientSection(patient: Patient) {
    this.doc.setFontSize(14);
    this.doc.text('Patient Details', 14, 40);

    this.doc.setFontSize(10);
    const startY = 45;
    let yPos = startY;

    this.doc.text(`Name: ${patient.display}`, 14, yPos);
    yPos += 6;

    this.doc.text(`Gender: ${patient.person.gender}`, 14, yPos);
    yPos += 6;

    this.doc.text(`Age: ${patient.person.age}`, 14, yPos);
    yPos += 6;

    this.doc.text(`Birth Date: ${patient.person.birthdate}`, 14, yPos);
    yPos += 6;

    patient.identifiers.forEach((identifier) => {
      this.doc.text(`${identifier.display}`, 14, yPos);
      yPos += 6;
    });

    this.doc.addPage();
  }

  private addVisitsSection(visits: Visit[]) {
    this.doc.setFontSize(14);
    this.doc.text('Visits', 14, 20);

    this.doc.setFontSize(10);
    let yPos = 25;

    visits.forEach((visit, index) => {
      if (index > 0 && yPos > 250) {
        this.doc.addPage();
        yPos = 20;
      }

      this.doc.text(`Visit: ${visit.display}`, 14, yPos);
      yPos += 6;

      yPos += 4;
    });

    this.doc.addPage();
  }

  private addEncountersSection(encounters: Encounter[]) {
    this.doc.setFontSize(14);
    this.doc.text('Encounters', 14, 20);

    this.doc.setFontSize(10);
    let yPos = 25;

    encounters.forEach((encounter, index) => {
      if (index > 0 && yPos > 250) {
        this.doc.addPage();
        yPos = 20;
      }

      this.doc.text(`Encounter: ${encounter.display}`, 14, yPos);
      yPos += 6;
      yPos += 4;
    });

    this.doc.addPage();
  }

  private addMedicationsSection(medications: Order[]) {
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
  const { patient, visits, encounters, medications, generatedAt } = printData;

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
        </style>
      </head>
      <body>
        <h1>Patient Information</h1>
        <p>Generated on: ${new Date(generatedAt).toLocaleString()}</p>
        
        <div class="section">
          <h2>Patient Details</h2>
          <div class="patient-info">
            <p><strong>Name:</strong> ${patient.display}</p>
            <p><strong>Gender:</strong> ${patient.person.gender}</p>
            <p><strong>Age:</strong> ${patient.person.age}</p>
            <p><strong>Birth Date:</strong> ${patient.person.birthdate}</p>
            ${patient.identifiers.map((id) => `<p><strong>${id.display}:</strong> ${id.display}</p>`).join('')}
          </div>
        </div>

        <div class="section">
          <h2>Visits (${visits.length})</h2>
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
              ${visits
                .map(
                  (visit) => `
                <tr>
                  <td>${visit.display}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Encounters (${encounters.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${encounters
                .map(
                  (encounter) => `
                <tr>
                  <td>${encounter.display}</td>
                </tr>
              `,
                )
                .join('')}
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
              </tr>
            </thead>
            <tbody>
              ${medications
                .map(
                  (med) => `
                <tr>
                  <td>${med.concept?.display || 'Unknown'}</td>
                  <td>${med.dosage || '-'}</td>
                  <td>${new Date(med.dateActivated).toLocaleDateString()}</td>
                </tr>
              `,
                )
                .join('')}
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
