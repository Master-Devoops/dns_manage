import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface GoDaddyRecord {
  type: string;
  name: string;
  data: string;
  ttl: number;
  priority?: number;
}

/**
 * Thin wrapper around the GoDaddy Domains REST API.
 * Docs: https://developer.godaddy.com/doc/endpoint/domains
 *
 * Secrets (GO_DADDY_API_KEY / GO_DADDY_API_SECRET) live only in this
 * backend service's environment and are never sent to the frontend.
 */
@Injectable()
export class GoDaddyService {
  private readonly logger = new Logger(GoDaddyService.name);
  private client: AxiosInstance;
  private domain: string;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('GO_DADDY_API_KEY');
    const apiSecret = this.config.get<string>('GO_DADDY_API_SECRET');
    const baseURL = this.config.get<string>('GO_DADDY_API_BASE_URL') || 'https://api.godaddy.com';
    this.domain = this.config.get<string>('GO_DADDY_DOMAIN') || 'devoops.in';

    this.client = axios.create({
      baseURL,
      headers: {
        Authorization: `sso-key ${apiKey}:${apiSecret}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  private handleError(context: string, error: any): never {
    const status = error?.response?.status;
    const data = error?.response?.data;
    this.logger.error(`GoDaddy API error [${context}]: ${status} ${JSON.stringify(data)}`);
    throw new BadGatewayException(
      `GoDaddy API request failed (${context}): ${data?.message || error.message}`,
    );
  }

  async listAllRecords(): Promise<GoDaddyRecord[]> {
    try {
      const { data } = await this.client.get(`/v1/domains/${this.domain}/records`);
      return data;
    } catch (error) {
      this.handleError('listAllRecords', error);
    }
  }

  async listRecordsByType(type: string): Promise<GoDaddyRecord[]> {
    try {
      const { data } = await this.client.get(`/v1/domains/${this.domain}/records/${type}`);
      return data;
    } catch (error) {
      this.handleError('listRecordsByType', error);
    }
  }

  /**
   * GoDaddy has no single "create one record" endpoint that won't clobber
   * others of the same type/name, so we PATCH (add) for creation.
   */
  async createRecord(record: GoDaddyRecord): Promise<void> {
    try {
      await this.client.patch(`/v1/domains/${this.domain}/records`, [record]);
    } catch (error) {
      this.handleError('createRecord', error);
    }
  }

  /**
   * Replaces all records of a given type+name with the provided array.
   * Use this for updates to a specific subdomain record.
   */
  async updateRecord(type: string, name: string, records: GoDaddyRecord[]): Promise<void> {
    try {
      await this.client.put(
        `/v1/domains/${this.domain}/records/${type}/${name}`,
        records,
      );
    } catch (error) {
      this.handleError('updateRecord', error);
    }
  }

  async deleteRecord(type: string, name: string): Promise<void> {
    try {
      await this.client.delete(`/v1/domains/${this.domain}/records/${type}/${name}`);
    } catch (error) {
      this.handleError('deleteRecord', error);
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.client.get(`/v1/domains/${this.domain}`);
      return true;
    } catch {
      return false;
    }
  }
}
