export interface Doctor {
  id: string;
  email: string;
  password: string; // Hashed
  name: string;
  createdAt: Date;
}
