import { type DashboardLinkConfig } from '@arunkumar-reddy/esm-patient-common-lib';

export const moduleName = '@arunkumar-reddy/esm-patient-medications-app';
export const dashboardMeta: DashboardLinkConfig & { slot: string } = {
  slot: 'patient-chart-medications-dashboard-slot',
  path: 'Medications',
  title: 'Medications',
  icon: 'omrs-icon-medication',
};
