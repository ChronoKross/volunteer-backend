export interface Employee {
  id: number;
  name: string;
  profilePic: string;
  position: number;
  wentHome: number;
  totalTimeVolunteered: number;
  declined: number;
  lastVolunteeredOn: string | null;
}
export interface TimelineEntry {
  id: number;
  name: string;
  profilePic: string;
  timestamp: string;
  hoursVolunteered: number;           
  totalTimeVolunteered: number;
}
