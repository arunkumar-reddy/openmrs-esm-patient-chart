import { type DrugOrderBasketItem } from '@arunkumar-reddy/esm-patient-common-lib';

type DrugsOrOrders = Pick<DrugOrderBasketItem, 'action' | 'commonMedicationName'>;

export function ordersEqual(order1: DrugsOrOrders, order2: DrugsOrOrders) {
  return order1.action === order2.action && order1.commonMedicationName === order2.commonMedicationName;
}
