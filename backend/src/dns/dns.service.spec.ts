import { Test, TestingModule } from '@nestjs/testing';
import { DnsService } from './dns.service';
import { PrismaService } from '../prisma/prisma.service';
import { GoDaddyService } from './godaddy/godaddy.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ConfigService } from '@nestjs/config';

describe('DnsService', () => {
  let service: DnsService;
  let prisma: PrismaService;
  let godaddy: GoDaddyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DnsService,
        {
          provide: PrismaService,
          useValue: {
            dnsRecord: {
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: GoDaddyService,
          useValue: {
            createRecord: jest.fn(),
            updateRecord: jest.fn(),
            deleteRecord: jest.fn(),
          },
        },
        {
          provide: ActivityLogsService,
          useValue: {
            log: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('devoops.in'),
          },
        },
      ],
    }).compile();

    service = module.get<DnsService>(DnsService);
    prisma = module.get<PrismaService>(PrismaService);
    godaddy = module.get<GoDaddyService>(GoDaddyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated records', async () => {
      const mockRecords = [{ id: '1', subdomain: 'test', type: 'A' }];
      jest.spyOn(prisma.dnsRecord, 'findMany').mockResolvedValue(mockRecords as any);
      jest.spyOn(prisma.dnsRecord, 'count').mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result.items).toEqual(mockRecords);
      expect(result.total).toBe(1);
    });
  });

  describe('create', () => {
    it('should create a DNS record on GoDaddy and DB', async () => {
      const dto = { subdomain: 'test', type: 'A' as any, data: '1.2.3.4', ttl: 3600 };
      const userId = 'user-1';
      
      jest.spyOn(prisma.dnsRecord, 'findFirst').mockResolvedValue(null);
      jest.spyOn(godaddy, 'createRecord').mockResolvedValue(undefined as any);
      jest.spyOn(prisma.dnsRecord, 'create').mockResolvedValue({ id: 'new-1', ...dto } as any);

      const result = await service.create(dto, userId);

      expect(godaddy.createRecord).toHaveBeenCalledWith({
        name: dto.subdomain,
        type: dto.type,
        data: dto.data,
        ttl: dto.ttl,
      });
      expect(prisma.dnsRecord.create).toHaveBeenCalled();
      expect(result.id).toBe('new-1');
    });
  });
});
