import {
  IsEnum,
  IsIP,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { RecordType } from '@prisma/client';

const HOSTNAME_REGEX = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)$/;

export class CreateDnsRecordDto {
  @IsString()
  @Matches(HOSTNAME_REGEX, {
    message:
      'Subdomain must be a valid hostname label (letters, numbers, hyphens; no leading/trailing hyphen)',
  })
  subdomain: string;

  @IsEnum(RecordType)
  type: RecordType;

  // For A records: validated as IPv4. For AAAA: IPv6. For others (CNAME/TXT/MX/NS): free-form string.
  @ValidateIf((o) => o.type === 'A')
  @IsIP('4', { message: 'Invalid IPv4 address' })
  @ValidateIf((o) => o.type === 'AAAA')
  @IsIP('6', { message: 'Invalid IPv6 address' })
  data: string;

  @IsInt()
  @Min(600, { message: 'TTL must be at least 600 seconds' })
  @Max(604800, { message: 'TTL must not exceed 604800 seconds (7 days)' })
  ttl: number;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
