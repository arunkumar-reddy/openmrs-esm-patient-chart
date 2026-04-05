import { type DashboardLinkConfig } from '@arunkumar-reddy/esm-patient-common-lib';

export const dashboardMeta: DashboardLinkConfig & { slot: string } = {
  slot: 'patient-chart-allergies-dashboard-slot',
  path: 'Allergies',
  title: 'Allergies',
  icon: 'omrs-icon-warning',
};
