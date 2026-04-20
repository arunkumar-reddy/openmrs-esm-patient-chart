import { type DashboardLinkConfig } from '@openmrs/ent-common-lib';

export const moduleName = '@openmrs/esm-patient-medications-app';
export const dashboardMeta: DashboardLinkConfig & { slot: string } = {
  slot: 'patient-chart-medications-dashboard-slot',
  path: 'Medications',
  title: 'Medications',
  icon: 'omrs-icon-medication',
};
