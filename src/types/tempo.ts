export interface TempoWorklog {
  id?: string;
  tempoWorklogId?: number;
  timeSpentSeconds?: number;
  timeSpent?: string;
  description?: string;
  started?: string;
  issue?: {
    id: string;
    key?: string;
  };
}

export interface TempoWorklogsResponse {
  results: TempoWorklog[];
  metadata?: {
    count?: number;
    offset?: number;
    limit?: number;
  };
}

export interface TempoWorklogCreateResponse {
  tempoWorklogId: number;
  timeSpentSeconds: number;
  timeSpent: string;
  description: string;
  started: string;
  issue: {
    id: string;
    key: string;
  };
  author: {
    accountId: string;
    name: string;
    displayName: string;
  };
}

export interface TempoWorkloadDay {
  day: string;
  requiredSeconds: number;
}

export interface TempoWorkloadScheme {
  days: TempoWorkloadDay[];
  defaultScheme: boolean;
  description: string;
  id: number;
  memberCount: number;
  name: string;
  self: string;
}

export interface TempoUserWorkload {
  accountId: string;
  workloadScheme: TempoWorkloadScheme;
} 