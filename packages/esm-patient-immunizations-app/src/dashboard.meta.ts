import { type DashboardLinkConfig } from '@arunkumar-reddy/esm-patient-common-lib';

export const dashboardMeta: DashboardLinkConfig & { slot: string } = {
  slot: 'patient-chart-immunizations-dashboard-slot',
  path: 'Immunizations',
  title: 'Immunizations',
  icon: 'omrs-icon-syringe',
};
