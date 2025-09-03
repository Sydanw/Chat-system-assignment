export interface Group {
  id: number;
  name: string;
  description: string;
  createdBy: number;
  members: number[];
  admins: number[];
  channels: number[];
}