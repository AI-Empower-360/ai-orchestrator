export interface Doctor {
  id: string;
  email: string;
  password: string; // Hashed
  name: string;
  organizationId?: string;
  organizationName?: string;
  createdAt: Date;
}
