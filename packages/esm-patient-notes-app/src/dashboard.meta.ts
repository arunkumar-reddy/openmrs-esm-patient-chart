import { type DashboardLinkConfig } from '@openmrs/ent-common-lib';

export const dashboardMeta: DashboardLinkConfig & { slot: string } = {
  slot: 'patient-chart-encounters-dashboard-slot',
  title: 'Encounters',
  path: 'Encounters',
};
