export interface IIncidentsProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  incidents: IncidentInfo[];
}

export interface IncidentInfo {
  number: string;
  description: string;
  short_description: string;
}

export interface IncidentResponse {
  result: IncidentInfo[];
}