import { Injectable, NotFoundException } from '@nestjs/common';
import { Organization } from '../common/interfaces/organization.interface';
import { CreateOrganizationDto } from '../common/dto/create-organization.dto';
import { UpdateOrganizationDto } from '../common/dto/update-organization.dto';
import { OrganizationResponseDto } from '../common/dto/organization-response.dto';
import { v4 as uuidv4 } from 'uuid';

// Mock organization database (replace with real database)
const MOCK_ORGANIZATIONS = new Map<string, Organization>();

@Injectable()
export class OrganizationService {
  constructor() {
    // Initialize with a default organization
    const defaultOrg: Organization = {
      id: '1',
      name: 'Default Organization',
      createdAt: new Date(),
    };
    MOCK_ORGANIZATIONS.set(defaultOrg.id, defaultOrg);
  }

  async create(
    createOrganizationDto: CreateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    const organization: Organization = {
      id: uuidv4(),
      name: createOrganizationDto.name,
      createdAt: new Date(),
    };

    MOCK_ORGANIZATIONS.set(organization.id, organization);
    return this.toResponseDto(organization);
  }

  async findAll(): Promise<OrganizationResponseDto[]> {
    const organizations = Array.from(MOCK_ORGANIZATIONS.values());
    return organizations.map((org) => this.toResponseDto(org));
  }

  async findOne(id: string): Promise<OrganizationResponseDto> {
    const organization = MOCK_ORGANIZATIONS.get(id);
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }
    return this.toResponseDto(organization);
  }

  async update(
    id: string,
    updateOrganizationDto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    const organization = MOCK_ORGANIZATIONS.get(id);
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    if (updateOrganizationDto.name !== undefined) {
      organization.name = updateOrganizationDto.name;
    }
    organization.updatedAt = new Date();

    MOCK_ORGANIZATIONS.set(id, organization);
    return this.toResponseDto(organization);
  }

  async remove(id: string): Promise<void> {
    const organization = MOCK_ORGANIZATIONS.get(id);
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }
    MOCK_ORGANIZATIONS.delete(id);
  }

  private toResponseDto(organization: Organization): OrganizationResponseDto {
    return {
      id: organization.id,
      name: organization.name,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }
}
