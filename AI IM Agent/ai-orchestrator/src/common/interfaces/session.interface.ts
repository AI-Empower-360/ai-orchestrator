import { SOAPNotesDto } from '../dto/soap-notes.dto';

export interface Session {
  id: string;
  doctorId: string;
  soap: SOAPNotesDto;
  createdAt: Date;
  updatedAt: Date;
}
