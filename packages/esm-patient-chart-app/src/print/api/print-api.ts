import { openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';

export interface Visit {
  uuid: string;
  display: string;
  links: Array<{
    rel: string;
    uri: string;
    resourceAlias: string;
  }>;
}

export interface Encounter {
  uuid: string;
  display: string;
  links: Array<{
    rel: string;
    uri: string;
    resourceAlias: string;
  }>;
}

export interface Obs {
  uuid: string;
  concept: {
    uuid: string;
    display: string;
  };
  value: any;
  groupingConcept?: {
    uuid: string;
    display: string;
  };
}

export interface Order {
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
  medications: Order[];
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

export async function getVisits(patientUuid: string, limit = 20): Promise<Visit[]> {
  const response = await openmrsFetch(
    `${restBaseUrl}/visit?patient=${patientUuid}&limit=${limit}&includeInactive=true`,
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

export async function getMedications(patientUuid: string, limit = 30): Promise<Order[]> {
  const response = await openmrsFetch(
    `${restBaseUrl}/order?patient=${patientUuid}&orderType=1326859f-7789-4e50-a46d-d906c5811e62&limit=${limit}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (response.status !== 200) {
    throw new Error(`Failed to fetch medications: ${response.status}`);
  }

  return response.data.results || [];
}

export async function fetchPrintData(patientUuid: string): Promise<PrintData> {
  const results = await Promise.allSettled([
    getPatient(patientUuid),
    getVisits(patientUuid),
    getEncounters(patientUuid),
    getMedications(patientUuid),
  ]);

  const [patientRes, visitsRes, encountersRes, medicationsRes] = results;

  // Patient is critical, so we still throw if it fails
  if (patientRes.status === 'rejected') {
    throw patientRes.reason;
  }

  return {
    patient: patientRes.value,
    visits: visitsRes.status === 'fulfilled' ? visitsRes.value : [],
    encounters: encountersRes.status === 'fulfilled' ? encountersRes.value : [],
    medications: medicationsRes.status === 'fulfilled' ? medicationsRes.value : [],
    generatedAt: new Date().toISOString(),
  };
}
