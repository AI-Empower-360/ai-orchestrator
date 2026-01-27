import { Test, TestingModule } from '@nestjs/testing';
import { NotesService } from './notes.service';

describe('NotesService', () => {
  let service: NotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotesService],
    }).compile();

    service = module.get<NotesService>(NotesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get notes for session', () => {
    const sessionId = 'test-session-123';
    const notes = service.getNotes(sessionId);
    expect(notes).toBeDefined();
    expect(notes.sessionId).toBe(sessionId);
  });

  it('should update notes for session', () => {
    const sessionId = 'test-session-123';
    const updateData = {
      soap: {
        subjective: 'Patient reports headache',
        objective: 'BP: 120/80',
        assessment: 'Normal',
        plan: 'Monitor',
      },
    };

    const result = service.updateNotes(sessionId, updateData);
    expect(result).toBeDefined();
    expect(result.soap).toEqual(updateData.soap);
  });
});
