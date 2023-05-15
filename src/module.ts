import { DataSourcePlugin } from '@grafana/data';
import { CosmosDataSource } from './datasource';
import { ConfigEditor } from './components/ConfigEditor';
import { QueryEditor } from './components/QueryEditor';
import { CosmosQuery, CosmosDataSourceOptions } from './types';

export const plugin = new DataSourcePlugin<CosmosDataSource, CosmosQuery, CosmosDataSourceOptions>(CosmosDataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
