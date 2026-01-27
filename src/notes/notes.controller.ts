import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { UpdateSOAPNotesDto, SOAPNotesResponseDto } from '../common/dto/soap-notes.dto';
import { SimpleJwtGuard } from '../auth/simple-jwt.guard';

@Controller('api/notes')
@UseGuards(SimpleJwtGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get(':sessionId')
  async getNotes(
    @Param('sessionId') sessionId: string,
  ): Promise<SOAPNotesResponseDto> {
    return this.notesService.getNotes(sessionId);
  }

  @Patch(':sessionId')
  async updateNotes(
    @Param('sessionId') sessionId: string,
    @Body() updateDto: UpdateSOAPNotesDto,
  ): Promise<SOAPNotesResponseDto> {
    return this.notesService.updateNotes(sessionId, updateDto.soap);
  }
}
