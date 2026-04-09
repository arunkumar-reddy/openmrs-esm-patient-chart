import { openmrsFetch, restBaseUrl, getConfig } from '@openmrs/esm-framework';
import { careSettingUuid as defaultCareSettingUuid } from '@arunkumar-reddy/esm-patient-common-lib';

export interface Diagnosis {
  uuid: string;
  display: string;
  rank: number;
  diagnosis: {
    coded?: {
      display: string;
      uuid: string;
    };
    nonCoded?: string;
  };
  voided: boolean;
  certainty?: string;
}

export interface Observation {
  uuid: string;
  concept: {
    uuid: string;
    display: string;
    conceptClass?: {
      uuid: string;
      display: string;
    };
  };
  display: string;
  value: any;
  obsDatetime: string;
  groupMembers?: Array<{
    uuid: string;
    concept: {
      uuid: string;
      display: string;
    };
    value: any;
    display: string;
  }>;
  groupingConcept?: {
    uuid: string;
    display: string;
  };
}

export interface EncounterOrder {
  uuid: string;
  orderType: {
    uuid: string;
    display: string;
  };
  concept?: {
    uuid: string;
    display: string;
  };
  drug?: {
    uuid: string;
    display: string;
    name: string;
    strength: string;
  };
  dose?: number;
  doseUnits?: {
    uuid: string;
    display: string;
  };
  frequency?: {
    uuid: string;
    display: string;
  };
  duration?: number;
  durationUnits?: {
    uuid: string;
    display: string;
  };
  quantity?: number;
  quantityUnits?: any;
  route?: {
    uuid: string;
    display: string;
  };
  dosingInstructions?: string;
  instructions?: string;
  dateActivated: string;
  dateStopped?: string;
  status?: string;
  action?: string;
}

export interface EncounterProvider {
  uuid: string;
  display: string;
  encounterRole?: {
    uuid: string;
    display: string;
  };
  provider?: {
    uuid: string;
    person?: {
      uuid: string;
      display: string;
    };
  };
}

export interface Encounter {
  uuid: string;
  display: string;
  encounterDatetime: string;
  encounterType?: {
    uuid: string;
    display: string;
  };
  form?: {
    uuid: string;
    display: string;
    name: string;
  };
  diagnoses: Diagnosis[];
  obs: Observation[];
  orders: EncounterOrder[];
  encounterProviders?: EncounterProvider[];
  links?: Array<{
    rel: string;
    uri: string;
    resourceAlias: string;
  }>;
}

export interface Visit {
  uuid: string;
  display: string;
  startDatetime: string;
  stopDatetime?: string;
  encounterDatetime?: string;
  location?: {
    uuid: string;
    display: string;
  };
  visitType?: {
    uuid: string;
    name: string;
    display: string;
  };
  encounters: Encounter[];
  links?: Array<{
    rel: string;
    uri: string;
    resourceAlias: string;
  }>;
}

export interface MedicationOrder {
  uuid: string;
  orderType: {
    uuid: string;
    display: string;
  };
  concept?: {
    uuid: string;
    display: string;
  };
  dosage?: string;
  dose?: number;
  doseUnits?: {
    uuid: string;
    display: string;
  };
  frequency?: string;
  duration?: string;
  durationUnits?: string;
  quantity?: number;
  quantityUnits?: {
    uuid: string;
    display: string;
  };
  routes?: {
    uuid: string;
    display: string;
  }[];
  instructions?: string;
  dosingInstructions?: string;
  dateActivated: string;
  dateStopped?: string;
  status: string;
}

export interface Patient {
  uuid: string;
  display: string;
  identifiers: Array<{
    uuid: string;
    display: string;
    links: Array<{
      rel: string;
      uri: string;
      resourceAlias: string;
    }>;
  }>;
  person: {
    uuid: string;
    display: string;
    gender: string;
    age: number;
    birthdate: string;
    birthdateEstimated: boolean;
    dead: boolean;
    deathDate: any;
    causeOfDeath: any;
    preferredName: {
      uuid: string;
      display: string;
      links: Array<{
        rel: string;
        uri: string;
        resourceAlias: string;
      }>;
    };
    preferredAddress: {
      uuid: string;
      display: string;
      links: Array<{
        rel: string;
        uri: string;
        resourceAlias: string;
      }>;
    };
    attributes: Array<{
      uuid: string;
      display: string;
      links: Array<{
        rel: string;
        uri: string;
        resourceAlias: string;
      }>;
    }>;
    voided: boolean;
    birthtime: any;
    deathdateEstimated: boolean;
    links: Array<{
      rel: string;
      uri: string;
      resourceAlias: string;
    }>;
    resourceVersion: string;
  };
  voided: boolean;
  links: Array<{
    rel: string;
    uri: string;
    resourceAlias: string;
  }>;
  resourceVersion: string;
}

export interface PrintData {
  patient: Patient;
  visits: Visit[];
  encounters: Encounter[];
  medications: MedicationOrder[];
  // Aggregated data from visits for easy access
  allDiagnoses: Diagnosis[];
  allObservations: Observation[];
  allOrders: EncounterOrder[];
  generatedAt: string;
}

export async function getPatient(patientUuid: string): Promise<Patient> {
  const response = await openmrsFetch(`${restBaseUrl}/patient/${patientUuid}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.status !== 200) {
    throw new Error(`Failed to fetch patient: ${response.status}`);
  }

  return response.data;
}

// Custom representation that includes encounters with diagnoses, observations, and orders
const visitCustomRepresentation =
  'custom:(uuid,display,startDatetime,stopDatetime,location,visitType:(uuid,name,display),encounters:(uuid,display,encounterDatetime,encounterType:(uuid,display),form:(uuid,display,name),diagnoses:(uuid,display,rank,diagnosis:(coded:(display,uuid),nonCoded),voided,certainty),obs:(uuid,concept:(uuid,display,conceptClass:(uuid,display)),display,value,obsDatetime,groupMembers:(uuid,concept:(uuid,display),value,display)),orders:full,encounterProviders:(uuid,display,encounterRole:(uuid,display),provider:(uuid,person:(uuid,display))),links),links)';

export async function getVisits(patientUuid: string, limit = 20): Promise<Visit[]> {
  const response = await openmrsFetch(
    `${restBaseUrl}/visit?patient=${patientUuid}&limit=${limit}&includeInactive=true&v=${visitCustomRepresentation}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (response.status !== 200) {
    throw new Error(`Failed to fetch visits: ${response.status}`);
  }

  return response.data.results || [];
}

export async function getEncounters(patientUuid: string, limit = 30): Promise<Encounter[]> {
  const response = await openmrsFetch(`${restBaseUrl}/encounter?patient=${patientUuid}&limit=${limit}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.status !== 200) {
    throw new Error(`Failed to fetch encounters: ${response.status}`);
  }

  return response.data.results || [];
}

export async function getMedications(
  patientUuid: string,
  limit = 30,
  careSettingUuid?: string,
  orderTypeUuid?: string,
): Promise<MedicationOrder[]> {
  // Use provided careSettingUuid, or get from config, or default to the one from common-lib
  const config = await getConfig('@arunkumar-reddy/esm-patient-chart-app');
  const careSetting = careSettingUuid || config?.drugCareSettingUuid || defaultCareSettingUuid;
  const orderType = orderTypeUuid || config?.drugOrderTypeUUID || '131168f4-15f5-102d-96e4-000c29c2a5d7';

  const response = await openmrsFetch(
    `${restBaseUrl}/order?patient=${patientUuid}&careSetting=${careSetting}&orderTypes=${orderType}&excludeCanceledAndExpired=true&v=custom:(uuid,dosingType,orderNumber,accessionNumber,patient:ref,action,careSetting:ref,previousOrder:ref,dateActivated,scheduledDate,dateStopped,autoExpireDate,orderType:ref,encounter:(uuid,display,visit),orderer:(uuid,display,person:(display)),orderReason,orderReasonNonCoded,orderType,urgency,instructions,commentToFulfiller,fulfillerStatus,drug:(uuid,display,strength,dosageForm:(display,uuid),concept),dose,doseUnits:ref,frequency:ref,asNeeded,asNeededCondition,quantity,quantityUnits:ref,numRefills,dosingInstructions,duration,durationUnits:ref,route:ref,brandName,dispenseAsWritten,concept)&limit=${limit}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (response.status !== 200) {
    throw new Error(`Failed to fetch medications: ${response.status}`);
  }

  // Transform the API response to map the dosage field correctly
  const results = response.data.results || [];
  return results.map((order: any) => {
    // Build comprehensive dosage string
    const dosageParts: string[] = [];

    // Add dose with units
    if (order.dose !== null && order.dose !== undefined) {
      const doseValue = order.dose;
      const doseUnitDisplay = order.doseUnits?.display || '';
      dosageParts.push(`DOSE ${doseValue} ${doseUnitDisplay}`.trim());
    }

    // Add route
    if (order.route?.display) {
      dosageParts.push(order.route.display.toLowerCase());
    }

    // Add frequency
    if (order.frequency?.display) {
      dosageParts.push(order.frequency.display.toLowerCase());
    }

    // Add duration
    if (order.duration !== null && order.duration !== undefined && order.durationUnits?.display) {
      dosageParts.push(`for ${order.duration} ${order.durationUnits.display.toLowerCase()}`);
    }

    // Add dosing instructions
    if (order.dosingInstructions) {
      dosageParts.push(order.dosingInstructions);
    }

    const dosage = dosageParts.join(' — ');

    return {
      ...order,
      dosage,
      // Map the status field (action in API response)
      status: order.action || order.status,
      // Keep dose and doseUnits for reference
      dose: order.dose,
      doseUnits: order.doseUnits,
      dosingInstructions: order.dosingInstructions,
    };
  });
}

export async function fetchPrintData(patientUuid: string): Promise<PrintData> {
  const config = await getConfig('@arunkumar-reddy/esm-patient-chart-app');
  const careSettingUuid = config?.drugCareSettingUuid || defaultCareSettingUuid;
  const orderTypeUuid = config?.drugOrderTypeUUID;

  const results = await Promise.allSettled([
    getPatient(patientUuid),
    getVisits(patientUuid),
    getEncounters(patientUuid),
    getMedications(patientUuid, 30, careSettingUuid, orderTypeUuid),
  ]);

  const [patientRes, visitsRes, encountersRes, medicationsRes] = results;

  // Patient is critical, so we still throw if it fails
  if (patientRes.status === 'rejected') {
    throw patientRes.reason;
  }

  const visits = visitsRes.status === 'fulfilled' ? visitsRes.value : [];
  const encounters = encountersRes.status === 'fulfilled' ? encountersRes.value : [];
  const medications = medicationsRes.status === 'fulfilled' ? medicationsRes.value : [];

  // Filter to only the most recent visit
  const mostRecentVisit = visits.length > 0 ? visits[0] : null;
  const filteredVisits = mostRecentVisit ? [mostRecentVisit] : [];

  // Aggregate diagnoses, observations, and orders from all encounters in the filtered visits
  const allDiagnoses: Diagnosis[] = [];
  const allObservations: Observation[] = [];
  const allOrders: EncounterOrder[] = [];

  filteredVisits.forEach((visit) => {
    visit.encounters?.forEach((encounter) => {
      // Collect diagnoses
      if (encounter.diagnoses) {
        allDiagnoses.push(...encounter.diagnoses.filter((d) => !d.voided));
      }

      // Collect observations
      if (encounter.obs) {
        allObservations.push(...encounter.obs);
      }

      // Collect orders from encounters
      if (encounter.orders) {
        allOrders.push(...encounter.orders);
      }
    });
  });

  return {
    patient: patientRes.value,
    visits: filteredVisits,
    encounters,
    medications,
    allDiagnoses,
    allObservations,
    allOrders,
    generatedAt: new Date().toISOString(),
  };
}
