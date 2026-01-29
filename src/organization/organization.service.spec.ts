import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationService } from './organization.service';
import { NotFoundException } from '@nestjs/common';

describe('OrganizationService', () => {
  let service: OrganizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrganizationService],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all organizations', async () => {
    const organizations = await service.findAll();
    expect(Array.isArray(organizations)).toBe(true);
    expect(organizations.length).toBeGreaterThan(0);
  });

  it('should find organization by id', async () => {
    const organizations = await service.findAll();
    const firstOrg = organizations[0];
    const foundOrg = await service.findOne(firstOrg.id);
    expect(foundOrg).toBeDefined();
    expect(foundOrg.id).toBe(firstOrg.id);
  });

  it('should create a new organization', async () => {
    const newOrg = await service.create({ name: 'Test Organization' });
    expect(newOrg).toBeDefined();
    expect(newOrg.name).toBe('Test Organization');
    expect(newOrg.id).toBeDefined();
    expect(newOrg.createdAt).toBeDefined();
  });

  it('should update an organization', async () => {
    const organizations = await service.findAll();
    const firstOrg = organizations[0];
    const updated = await service.update(firstOrg.id, {
      name: 'Updated Organization',
    });
    expect(updated).toBeDefined();
    expect(updated.name).toBe('Updated Organization');
    expect(updated.updatedAt).toBeDefined();
  });

  it('should throw NotFoundException for non-existent organization', async () => {
    await expect(service.findOne('non-existent-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should delete an organization', async () => {
    const newOrg = await service.create({ name: 'To Be Deleted' });
    await service.remove(newOrg.id);
    await expect(service.findOne(newOrg.id)).rejects.toThrow(
      NotFoundException,
    );
  });
});
