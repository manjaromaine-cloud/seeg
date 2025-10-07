export type IncidentStatus = "scheduled" | "ongoing" | "resolved" | "reported";
export type ServiceType = "water" | "electricity";

export interface Incident {
  id: string;
  title: string;
  description: string | null;
  service_type: ServiceType;
  status: IncidentStatus;
  start_time: string;
  expected_end_time: string | null;
  sector_id: string;
  latitude?: number;
  longitude?: number;
  sectors?: {
    name: string;
  };
}