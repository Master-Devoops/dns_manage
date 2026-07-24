import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RecordType, RecordStatus } from '@prisma/client';

export class QueryDnsRecordDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(RecordType)
  type?: RecordType;

  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
