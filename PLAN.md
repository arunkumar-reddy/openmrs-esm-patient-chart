# Print Patient Info Feature - Implementation Plan
## Overview
Add a "Print Patient Info" button to the left navigation pane of the patient chart that prints visit, medication, and billing information for all patients. This feature adapts code from the shelved `openmrs-print-module` project.
## Architecture
### Current State
- Left navigation uses `LeftNavMenu` from `@openmrs/esm-framework`
- Navigation items are registered to `patient-chart-dashboard-slot` extension
- Dashboard links use `createDashboardLink` pattern
- Workspace system manages side-panel forms
### Target State
- Add print button as navigation item alongside "Patient Summary" and "Visits"
- Button launches print preview workspace/modal
- Print preview displays patient info, visits, medications, encounters
- Support browser print and PDF download
---
## Implementation Phases
### Phase 1: Core Print Components
#### 1.1 Print API Layer
**File:** `packages/esm-patient-chart-app/src/print/print-api.ts`
**Purpose:** Fetch patient data for printing
**Content:** Adapt from `openmrs-print-module/src/api/api.ts`
```typescript
import { openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';
export interface Visit { /* ... */ }
export interface Encounter { /* ... */ }
export interface Order { /* ... */ }
export interface Patient { /* ... */ }
export async function getPatient(patientUuid: string): Promise<Patient> { }
export async function getVisits(patientUuid: string): Promise<Visit[]> { }
export async function getEncounters(patientUuid: string): Promise<Encounter[]> { }
export async function getMedications(patientUuid: string): Promise<Order[]> { }
Dependencies: @openmrs/esm-framework
---
1.2 Print Data Generator
File: packages/esm-patient-chart-app/src/print/print-generator.ts
Purpose: Generate printable HTML and PDF
Content: Copy from openmrs-print-module/src/api/pdf-generator.ts
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
export interface PrintData {
  patient: any;
  visits: any[];
  encounters: any[];
  medications: any[];
  generatedAt: string;
}
export class PDFGenerator {
  generatePDF(printData: PrintData): jsPDF { }
  savePDF(filename: string): void { }
}
export async function printViaBrowser(printData: PrintData): Promise<void> { }
Dependencies: jspdf, html2canvas
---
1.3 Print Preview Component
File: packages/esm-patient-chart-app/src/print/print-preview.component.tsx
Purpose: Display print preview with patient data
Content: Adapt from openmrs-print-module/src/components/PrintPreviewModal.tsx
Adaptations:
- Replace custom CSS with Carbon Design System components
- Use Carbon Modal, DataTable, Card, Typography
- Responsive design for desktop/mobile
- Include sections: Patient Info, Visits, Encounters, Medications
Props:
interface PrintPreviewProps {
  patientUuid: string;
  onClose: () => void;
  onPrint: (method: 'browser' | 'pdf') => void;
}
Dependencies: @carbon/react, @openmrs/esm-framework, react-i18next
---
1.4 Print Navigation Link
File: packages/esm-patient-chart-app/src/print/print-nav-link.component.tsx
Purpose: Render print button in left navigation
Content: New component following documentation pattern
import React from 'react';
import { useTranslation } from 'react-i18next';
import { PrinterIcon, launchWorkspace2 } from '@openmrs/esm-framework';
import { usePatientChartStore } from '@openmrs/esm-patient-common-lib';
const PrintNavLink: React.FC = () => {
  const { t } = useTranslation();
  const { patientUuid } = usePatientChartStore();
  
  const handlePrint = () => {
    launchWorkspace2('print-workspace', { patientUuid });
  };
  
  return (
    <div className="cds--side-nav__item">
      <button 
        className="cds--side-nav__link"
        onClick={handlePrint}
      >
        <PrinterIcon />
        <span>{t('printPatientInfo', 'Print Patient Info')}</span>
      </button>
    </div>
  );
};
Dependencies: @openmrs/esm-framework, @openmrs/esm-patient-common-lib
---
1.5 Print Workspace
File: packages/esm-patient-chart-app/src/print/print.workspace.tsx
Purpose: Host print preview in patient chart workspace
Content: Workspace wrapper for print preview
import React from 'react';
import { WorkspaceHeader } from '@openmrs/esm-framework';
import PrintPreview from './print-preview.component';
import styles from './print.workspace.scss';
interface PrintWorkspaceProps {
  patientUuid: string;
  closeWorkspace: () => void;
}
const PrintWorkspace: React.FC<PrintWorkspaceProps> = ({ patientUuid, closeWorkspace }) => {
  return (
    <div className={styles.container}>
      <WorkspaceHeader 
        title="Print Patient Info" 
        onClose={closeWorkspace}
      />
      <PrintPreview 
        patientUuid={patientUuid}
        onClose={closeWorkspace}
        onPrint={handlePrint}
      />
    </div>
  );
};
Dependencies: @openmrs/esm-framework, Carbon components
---
Phase 2: Integration
2.1 Register Extension in routes.json
File: packages/esm-patient-chart-app/src/routes.json
Add extensions:
{
  "name": "print-patient-info",
  "slot": "patient-chart-dashboard-slot",
  "component": "printNavLink",
  "meta": {
    "title": "Print Patient Info",
    "path": "Print",
    "icon": "PrinterIcon"
  },
  "order": 10,
  "online": true,
  "offline": true
}
Add workspace:
{
  "name": "print-workspace",
  "component": "printWorkspace",
  "window": "print-patient"
}
---
2.2 Export Components in index.ts
File: packages/esm-patient-chart-app/src/index.ts
Add exports:
export const printNavLink = getSyncLifecycle(
  printNavLinkComponent,
  { featureName: 'print-patient-nav-link', moduleName }
);
export const printWorkspace = getAsyncLifecycle(
  () => import('./print/print.workspace'),
  { featureName: 'print-workspace', moduleName }
);
export const printPreview = getAsyncLifecycle(
  () => import('./print/print-preview.component'),
  { featureName: 'print-preview', moduleName }
);
---
2.3 Add Dependencies
File: packages/esm-patient-chart-app/package.json
Add to dependencies:
{
  "dependencies": {
    "jspdf": "2.5.1",
    "html2canvas": "1.4.1"
  }
}
---
2.4 Add Translations
File: packages/esm-patient-chart-app/translations/en.json
Add keys:
{
  "printPatientInfo": "Print Patient Info",
  "printPreview": "Print Preview",
  "patientInfo": "Patient Information",
  "visits": "Visits",
  "encounters": "Encounters",
  "medications": "Medications",
  "printBrowser": "Print (Browser)",
  "downloadPdf": "Download PDF",
  "cancel": "Cancel",
  "printing": "Printing...",
  "errorFetchingData": "Error fetching data: {{error}}",
  "noVisits": "No visits recorded",
  "noEncounters": "No encounters recorded",
  "noMedications": "No medications prescribed"
}
---
Phase 3: Styling
3.1 Print Workspace Styles
File: packages/esm-patient-chart-app/src/print/print.workspace.scss
@use '@carbon/layout';
@use '@carbon/type';
@use '@openmrs/esm-styleguide/src/vars' as *;
.container {
  padding: layout.$spacing-05;
  height: 100%;
  overflow-y: auto;
}
3.2 Print Preview Styles
File: packages/esm-patient-chart-app/src/print/print-preview.scss
@use '@carbon/layout';
@use '@carbon/type';
@use '@carbon/colors';
.preview-container {
  height: 100%;
  overflow-y: auto;
}
.patient-info {
  background-color: $ui-01;
  padding: layout.$spacing-05;
  border-radius: layout.$spacing-01;
  margin-bottom: layout.$spacing-05;
}
.section {
  margin-bottom: layout.$spacing-05;
  
  h3 {
    @include type.type-style('heading-compact-01');
    color: $text-02;
    margin-bottom: layout.$spacing-03;
  }
}
---
Data Flow
User clicks "Print Patient Info" in left nav
       ↓
launchWorkspace2('print-workspace', { patientUuid })
       ↓
PrintWorkspace mounts
       ↓
PrintPreview fetches data via print-api.ts
       ↓
getPatient(), getVisits(), getEncounters(), getMedications()
       ↓
Display data in preview
       ↓
User clicks "Print" or "Download PDF"
       ↓
printViaBrowser() or PDFGenerator.generatePDF()
       ↓
Print dialog or PDF download
---
## Testing Checklist
### Unit Tests
- [ ] Print API functions (getPatient, getVisits, etc.)
- [ ] PDFGenerator class methods
- [ ] PrintPreview component rendering
- [ ] PrintNavLink click handler
- [ ] PrintWorkspace props handling
### Integration Tests
- [ ] Navigation button appears in left menu
- [ ] Workspace opens with correct patient data
- [ ] Print methods trigger correctly
- [ ] Error handling for failed data fetch
### E2E Tests (Optional)
- [ ] Navigate to patient chart
- [ ] Click print button
- [ ] Verify preview displays correct data
- [ ] Trigger browser print
- [ ] Trigger PDF download
---
Dependencies
New Dependencies
- jspdf@2.5.1 - PDF generation
- html2canvas@1.4.1 - HTML to canvas conversion
Existing Dependencies (Already in patient-chart-app)
- @openmrs/esm-framework - Core framework
- @openmrs/esm-patient-common-lib - Patient data utilities
- @carbon/react - UI components
- react-i18next - Internationalization
---
Migration from Print Module
Files to Copy
1. ✅ api/api.ts → print/print-api.ts (adapt)
2. ✅ api/pdf-generator.ts → print/print-generator.ts (as-is)
3. ✅ components/PrintPreviewModal.tsx → print/print-preview.component.tsx (adapt)
4. ❌ components/PrintButton.tsx → Not needed (replaced by nav link)
5. ❌ commands/print-patient-action.tsx → Not needed (replaced by workspace)
Adaptations Required
1. PatientUuid Source: 
   - From: window.__openmrsPatientContext?.patientUuid
   - To: usePatientChartStore() from common-lib
2. Modal System:
   - From: Custom overlay modal
   - To: Carbon Modal OR patient-chart workspace
3. Styling:
   - From: Custom CSS modules
   - To: Carbon Design System components
4. Navigation:
   - From: Patient header action button
   - To: Left navigation extension
---
Configuration Options
Optional Features
1. Limit Data Count:
   - Current: Visits (20), Encounters (30), Medications (30)
   - Configurable via global property or config.json
2. Include Billing:
   - Currently: Not implemented
   - Requires: Backend API endpoint for billing data
   - Optional: Add billing section if data available
3. Print Formats:
   - Current: Browser print + PDF download
   - Optional: Add custom print template
---
Risks & Mitigations
Risk 1: Large Data Sets
Issue: Fetching too much data may slow down print preview
Mitigation: Limit results (already implemented), add pagination
Risk 2: PDF Generation Performance
Issue: Large PDFs may timeout or fail
Mitigation: Use async generation, show loading state, add timeout handling
Risk 3: Browser Compatibility
Issue: html2canvas may not work in all browsers
Mitigation: Fallback to browser print, add feature detection
Risk 4: Memory Usage
Issue: Storing large amounts of data in workspace
Mitigation: Clean up on workspace close, use React Query cache
---
Success Criteria
1. ✅ Print button appears in left navigation
2. ✅ Button opens workspace with patient data
3. ✅ Preview displays visits, medications, encounters
4. ✅ Browser print works correctly
5. ✅ PDF download works correctly
6. ✅ Error handling for failed data fetch
7. ✅ Responsive design (desktop/mobile)
8. ✅ Accessibility (keyboard navigation, ARIA labels)
9. ✅ Translations (i18n support)
---
Timeline Estimate
- Phase 1 (Core Components): 2-3 days
- Phase 2 (Integration): 1 day
- Phase 3 (Styling & Tests): 1-2 days
- Total: 4-6 days
---
Next Steps
1. Review and approve this plan
2. Create PLAN.md file in repository
3. Begin Phase 1 implementation
4. Run tests after each phase
5. Deploy to test environment
6. User acceptance testing
7. Deploy to production
---
Questions for Review
1. Billing Data: Should we add billing support? If yes, what's the API endpoint?
2. Workspace vs Modal: Workspace (recommended) or modal?
3. Print Methods: Keep both browser print and PDF download?
4. Icon: Use PrinterIcon or custom SVG?
5. Navigation Order: Order 10 (after Visits) acceptable?
6. Data Limits: Current limits (20 visits, 30 encounters, 30 medications) acceptable?
---
Document created: 2026-03-31
Version: 1.0