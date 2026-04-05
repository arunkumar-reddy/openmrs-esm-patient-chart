import { type DashboardLinkConfig } from '@arunkumar-reddy/esm-patient-common-lib';

export const dashboardMeta: DashboardLinkConfig & { slot: string } = {
  slot: 'patient-chart-encounters-dashboard-slot',
  title: 'Encounters',
  path: 'Encounters',
};
