import { IsOptional, IsString } from 'class-validator';

export class SOAPNotesDto {
  @IsOptional()
  @IsString()
  subjective?: string;

  @IsOptional()
  @IsString()
  objective?: string;

  @IsOptional()
  @IsString()
  assessment?: string;

  @IsOptional()
  @IsString()
  plan?: string;
}

export class UpdateSOAPNotesDto {
  soap: SOAPNotesDto;
}

export class SOAPNotesResponseDto {
  sessionId: string;
  soap: SOAPNotesDto;
  updatedAt: string;
}
