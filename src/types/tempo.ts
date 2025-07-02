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