import { type DashboardLinkConfig } from '@arunkumar-reddy/esm-patient-common-lib';

export const ordersDashboardMeta: DashboardLinkConfig & { slot: string; hideDashboardTitle: boolean } = {
  slot: 'patient-chart-lab-orders-dashboard-slot',
  path: 'Orders',
  title: 'Orders',
  icon: 'omrs-icon-shopping-cart',
  hideDashboardTitle: true,
};
