import { type DashboardLinkConfig } from '@arunkumar-reddy/esm-patient-common-lib';

export const dashboardMeta: DashboardLinkConfig & { slot: string } = {
  slot: 'patient-chart-attachments-dashboard-slot',
  path: 'Attachments',
  title: 'Attachments',
  icon: 'omrs-icon-document-attachment',
};
