import { type DashboardLinkConfig } from '@arunkumar-reddy/esm-patient-common-lib';

export const dashboardMeta: DashboardLinkConfig & { slot: string } = {
  slot: 'patient-chart-conditions-dashboard-slot',
  path: 'Conditions',
  title: 'Conditions',
  icon: 'omrs-icon-list-checked',
};
