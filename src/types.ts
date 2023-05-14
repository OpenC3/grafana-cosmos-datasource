import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface MyQuery extends DataQuery {
  queryText?: string;
  server?: string;
  capacity: number;
  item: string;
}

export const defaultQuery: Partial<MyQuery> = {
  capacity: 3600,
  item: '',
};

/**
 * These are options configured for each DataSource instance
 */
export interface MyDataSourceOptions extends DataSourceJsonData {
  url: string;
  scope: string;
  password: string;
}
