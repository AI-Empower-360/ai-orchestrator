import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';

describe('OrganizationController', () => {
  let controller: OrganizationController;
  let service: OrganizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationController],
      providers: [OrganizationService],
    }).compile();

    controller = module.get<OrganizationController>(OrganizationController);
    service = module.get<OrganizationService>(OrganizationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all organizations', async () => {
    const result = await controller.findAll();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should create an organization', async () => {
    const createDto = { name: 'Test Org' };
    const result = await controller.create(createDto);
    expect(result).toBeDefined();
    expect(result.name).toBe('Test Org');
  });

  it('should find one organization', async () => {
    const organizations = await service.findAll();
    const result = await controller.findOne(organizations[0].id);
    expect(result).toBeDefined();
  });

  it('should update an organization', async () => {
    const organizations = await service.findAll();
    const updateDto = { name: 'Updated Name' };
    const result = await controller.update(organizations[0].id, updateDto);
    expect(result.name).toBe('Updated Name');
  });

  it('should delete an organization', async () => {
    const newOrg = await service.create({ name: 'To Delete' });
    await controller.remove(newOrg.id);
    expect(async () => await controller.findOne(newOrg.id)).rejects.toThrow();
  });
});
