import html2canvas from 'html2canvas';
import type { PrintData, Vitals } from '../api/print-api';

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
  const {
    patient,
    visits,
    medications,
    allDiagnoses = [],
    allObservations = [],
    allOrders = [],
    generatedAt,
  } = printData;

  // Helper to sort diagnoses by rank
  const sortedDiagnoses = [...allDiagnoses].sort((a, b) => a.rank - b.rank);

  // Use the first visit if visits array is provided (filtered visit)
  const selectedVisit = visits.length > 0 ? visits[0] : null;

  // Filter diagnoses, observations, and orders based on selected visit
  const filteredDiagnoses = !selectedVisit
    ? sortedDiagnoses
    : sortedDiagnoses.filter((d) =>
        new Set(selectedVisit.encounters.flatMap((enc) => enc.diagnoses.map((d) => d.uuid))).has(d.uuid),
      );

  const filteredObservations = !selectedVisit
    ? allObservations
    : allObservations.filter((o) =>
        new Set(selectedVisit.encounters.flatMap((enc) => enc.obs.map((o) => o.uuid))).has(o.uuid),
      );

  const filteredOrders = !selectedVisit
    ? allOrders
    : allOrders.filter((o) =>
        new Set(selectedVisit.encounters.flatMap((enc) => enc.orders.map((o) => o.uuid))).has(o.uuid),
      );

  // Vital sign concept UUIDs
  const vitalSignUuids = new Set([
    '5085AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // systolic BP
    '5086AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // diastolic BP
    '5087AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // pulse
    '5088AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // temperature
    '5089AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // weight
    '5090AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // height
    '5242AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // respiratory rate
  ]);

  // Extract vitals from filtered observations
  const extractVitals = (observations: typeof allObservations): Vitals => {
    const vitals: Vitals = {};
    let systolic: number | undefined;
    let diastolic: number | undefined;
    let height: number | undefined;
    let weight: number | undefined;

    observations.forEach((obs) => {
      const conceptUuid = obs.concept?.uuid;
      const value = typeof obs.value === 'object' ? obs.value?.display : obs.value;
      const numericValue = value !== null && value !== undefined ? Number(value) : undefined;

      if (conceptUuid === '5085AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' && numericValue) {
        systolic = numericValue;
      }
      if (conceptUuid === '5086AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' && numericValue) {
        diastolic = numericValue;
      }
      if (conceptUuid === '5087AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' && numericValue) {
        vitals.pulse = numericValue;
      }
      if (conceptUuid === '5088AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' && numericValue) {
        vitals.temperature = numericValue;
      }
      if (conceptUuid === '5089AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' && numericValue) {
        weight = numericValue;
      }
      if (conceptUuid === '5090AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' && numericValue) {
        height = numericValue;
      }
      if (conceptUuid === '5242AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' && numericValue) {
        vitals.respiratoryRate = numericValue;
      }
    });

    // Calculate BMI if we have both weight and height
    if (weight != null && height != null && weight > 0 && height > 0) {
      vitals.bmi = Number((weight / (height / 100) ** 2).toFixed(1));
    }

    // Set blood pressure if we have both systolic and diastolic
    if (systolic != null && diastolic != null) {
      vitals.bloodPressure = { systolic, diastolic };
    }

    return vitals;
  };

  // Filter out vital sign observations from the observations list
  const filteredNonVitalObservations = filteredObservations.filter((obs) => !vitalSignUuids.has(obs.concept?.uuid));
  const filteredVitals = extractVitals(filteredObservations);

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
            margin-bottom: 12px;
          }
          h2 {
            color: #444;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
          }
          .patient-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 8px 20px;
            padding: 10px 12px;
            background-color: #f5f5f5;
            border-radius: 5px;
            margin-top: 4px;
          }
          .patient-grid-item {
            display: flex;
            flex-direction: row;
            align-items: baseline;
            gap: 8px;
          }
          .patient-grid-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #777;
            flex-shrink: 0;
          }
          .patient-grid-value {
            font-size: 13px;
            font-weight: 500;
            color: #333;
            word-break: break-word;
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
          .empty-state {
            color: #666;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="section">
          <h2>Patient Details</h2>
          <div class="patient-grid">
            <div class="patient-grid-item">
              <span class="patient-grid-label">Name:</span>
              <span class="patient-grid-value">${patient.person.preferredName.display}</span>
            </div>
            <div class="patient-grid-item">
              <span class="patient-grid-label">Patient ID:</span>
              <span class="patient-grid-value">
                ${
                  patient.identifiers
                    .find((id) => id.display.includes('OpenMRS ID'))
                    ?.display.replace(/.*[=:]/, '')
                    .trim() || '-'
                }
              </span>
            </div>
            <div class="patient-grid-item">
              <span class="patient-grid-label">Gender:</span>
              <span class="patient-grid-value">${patient.person.gender}</span>
            </div>
            <div class="patient-grid-item">
              <span class="patient-grid-label">Age:</span>
              <span class="patient-grid-value">${patient.person.age}</span>
            </div>
            <div class="patient-grid-item">
              <span class="patient-grid-label">Birth Date:</span>
              <span class="patient-grid-value">${formatBirthDate(patient.person.birthdate)}</span>
            </div>
            ${patient.identifiers
              .filter((identifier) => !identifier.display.includes('OpenMRS ID'))
              .map(
                (identifier) => `
            <div class="patient-grid-item">
              <span class="patient-grid-label">${identifier.display}:</span>
              <span class="patient-grid-value">${identifier.display}</span>
            </div>`,
              )
              .join('')}
            ${
              selectedVisit
                ? `
            <div class="patient-grid-item">
              <span class="patient-grid-label">Visit Date:</span>
              <span class="patient-grid-value">${formatDateTime(selectedVisit.startDatetime)}</span>
            </div>`
                : ''
            }
          </div>
        </div>

        <div class="section">
          <h2>Vitals</h2>
          ${
            filteredVitals.bloodPressure ||
            filteredVitals.pulse !== undefined ||
            filteredVitals.temperature !== undefined ||
            filteredVitals.height !== undefined ||
            filteredVitals.weight !== undefined ||
            filteredVitals.respiratoryRate !== undefined ||
            filteredVitals.bmi !== undefined
              ? `
          <table>
            <thead>
              <tr>
                <th>Vital Sign</th>
                <th style="text-align: center;">Value</th>
              </tr>
            </thead>
            <tbody>
              ${
                filteredVitals.bloodPressure
                  ? `
                <tr>
                  <td>Blood Pressure</td>
                  <td style="text-align: center;">${filteredVitals.bloodPressure.systolic}/${filteredVitals.bloodPressure.diastolic}</td>
                </tr>`
                  : ''
              }
              ${
                filteredVitals.pulse !== undefined
                  ? `
                <tr>
                  <td>Pulse</td>
                  <td style="text-align: center;">${filteredVitals.pulse} bpm</td>
                </tr>`
                  : ''
              }
              ${
                filteredVitals.temperature !== undefined
                  ? `
                <tr>
                  <td>Temperature</td>
                  <td style="text-align: center;">${filteredVitals.temperature} °C</td>
                </tr>`
                  : ''
              }
              ${
                filteredVitals.height !== undefined
                  ? `
                <tr>
                  <td>Height</td>
                  <td style="text-align: center;">${filteredVitals.height} cm</td>
                </tr>`
                  : ''
              }
              ${
                filteredVitals.weight !== undefined
                  ? `
                <tr>
                  <td>Weight</td>
                  <td style="text-align: center;">${filteredVitals.weight} kg</td>
                </tr>`
                  : ''
              }
              ${
                filteredVitals.respiratoryRate !== undefined
                  ? `
                <tr>
                  <td>Respiratory Rate</td>
                  <td style="text-align: center;">${filteredVitals.respiratoryRate} /min</td>
                </tr>`
                  : ''
              }
              ${
                filteredVitals.bmi !== undefined
                  ? `
                <tr>
                  <td>BMI</td>
                  <td style="text-align: center;">${filteredVitals.bmi} kg/m²</td>
                </tr>`
                  : ''
              }
            </tbody>
          </table>`
              : '<p class="empty-state">No vitals recorded</p>'
          }
        </div>

        <div class="section">
          <h2>Diagnoses (${filteredDiagnoses.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Diagnosis</th>
                <th>Certainty</th>
              </tr>
            </thead>
            <tbody>
              ${
                filteredDiagnoses.length > 0
                  ? filteredDiagnoses
                      .map(
                        (diagnosis) => `
                <tr>
                  <td>${diagnosis.rank}</td>
                  <td>${getDiagnosisDisplay(diagnosis)}</td>
                  <td>${diagnosis.certainty || '-'}</td>
                </tr>
              `,
                      )
                      .join('')
                  : '<tr><td colspan="3" class="empty-state">No diagnoses recorded</td></tr>'
              }
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Observations (${filteredNonVitalObservations.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Observation</th>
                <th style="text-align: center;">Value</th>
              </tr>
            </thead>
            <tbody>
              ${
                filteredNonVitalObservations.length > 0
                  ? filteredNonVitalObservations
                      .map(
                        (obs) => `
                <tr>
                  <td>${obs.concept.display}</td>
                  <td style="text-align: center;">${formatObservationValue(obs)}</td>
                </tr>
              `,
                      )
                      .join('')
                  : '<tr><td colspan="2" class="empty-state">No observations recorded</td></tr>'
              }
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Orders (${filteredOrders.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Concept</th>
                <th>Dosage</th>
                <th>Date Activated</th>
              </tr>
            </thead>
            <tbody>
              ${
                filteredOrders.length > 0
                  ? filteredOrders
                      .map((order) => {
                        // Build dosage string similar to medications
                        const dosageParts = [];

                        if (order.dose !== null && order.dose !== undefined) {
                          const doseUnitDisplay = order.doseUnits?.display || '';
                          dosageParts.push(`${order.dose} ${doseUnitDisplay}`.trim());
                        }

                        if (order.route?.display) {
                          dosageParts.push(order.route.display.toLowerCase());
                        }

                        if (order.frequency?.display) {
                          dosageParts.push(order.frequency.display.toLowerCase());
                        }

                        if (order.duration !== null && order.duration !== undefined && order.durationUnits?.display) {
                          dosageParts.push(`for ${order.duration} ${order.durationUnits.display.toLowerCase()}`);
                        }

                        if (order.dosingInstructions) {
                          dosageParts.push(order.dosingInstructions);
                        }

                        if (order.instructions) {
                          dosageParts.push(order.instructions);
                        }

                        const dosage = dosageParts.length > 0 ? dosageParts.join(' — ') : '-';

                        return `
                <tr>
                  <td>${order.concept?.display || 'Unknown'}</td>
                  <td>${dosage}</td>
                  <td>${formatDateTime(order.dateActivated)}</td>
                </tr>
              `;
                      })
                      .join('')
                  : '<tr><td colspan="3" class="empty-state">No orders recorded</td></tr>'
              }
            </tbody>
          </table>
        </div>

      </body>
    </html>
  `;
}
