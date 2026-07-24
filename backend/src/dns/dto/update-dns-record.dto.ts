import { PartialType } from '@nestjs/mapped-types';
import { CreateDnsRecordDto } from './create-dns-record.dto';

export class UpdateDnsRecordDto extends PartialType(CreateDnsRecordDto) {}
