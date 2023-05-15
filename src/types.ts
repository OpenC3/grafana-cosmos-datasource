import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface CosmosQuery extends DataQuery {
  target?: string;
  packet?: string;
  item?: string;
  items: string[];
}

/**
 * These are options configured for each DataSource instance
 */
export interface CosmosDataSourceOptions extends DataSourceJsonData {
  url: string;
  scope: string;
  password: string;
}
