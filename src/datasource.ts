import defaults from 'lodash/defaults';

import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  CircularDataFrame,
  FieldType,
  LoadingState,
} from '@grafana/data';
import { getTemplateSrv } from '@grafana/runtime';
import { Observable, merge } from 'rxjs';

import { MyQuery, MyDataSourceOptions, defaultQuery } from './types';
import * as ActionCable from '@rails/actioncable';

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  serverURL: string;
  subscription: any;
  cable: any;

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
    this.serverURL = instanceSettings.jsonData.url || 'ws://localhost:2900';
    let scope = 'DEFAULT';
    let auth = 'password';
    this.cable = ActionCable.createConsumer(
      'ws:localhost:2900/openc3-api/cable?scope=' + scope + '&authorization=' + auth
    );
  }

  query(options: DataQueryRequest<MyQuery>): Observable<DataQueryResponse> {
    const observables = options.targets.map((target) => {
      const query = defaults(target, defaultQuery);
      return new Observable<DataQueryResponse>((subscriber) => {
        query.timeoutS = parseFloat(getTemplateSrv().replace(query.timeoutS.toString(), options.scopedVars));
        query.server = getTemplateSrv().replace(query.server, options.scopedVars);
        query.capacity = parseFloat(getTemplateSrv().replace(query.capacity.toString(), options.scopedVars));
        const frame = new CircularDataFrame({
          append: 'tail',
          capacity: query.capacity || 1000,
        });

        let startTemp = new Date('2023/05/12' + ' ' + '16:35:00');
        // let endTemp = new Date('2023/05/12' + ' ' + '16:05:00');
        let key = `DECOM__TLM__INST__HEALTH_STATUS__TEMP1__CONVERTED`;
        let items: string[][] = [];
        items.push([key, '0']);

        let subscription = this.cable.subscriptions.create(
          { channel: 'StreamingChannel' },
          {
            connected() {
              frame.addField({ name: 'time', type: FieldType.time });
              frame.addField({ name: 'TEMP1', type: FieldType.number });

              console.log('connected');
              subscription.perform('add', {
                scope: 'DEFAULT',
                token: 'password',
                items: items,
                start_time: startTemp.getTime() * 1_000_000,
                end_time: null, // endTemp.getTime() * 1_000_000,
              });
            },
            received: (data: any) => {
              data.forEach((item: any) => {
                frame.add({ time: item['__time'] / 1_000_000, TEMP1: item['0'] });
              });

              subscriber.next({
                data: [frame],
                key: query.refId,
                state: LoadingState.Streaming,
              });
            },
          }
        );
      });
    });
    return merge(...observables);
  }

  async testDatasource() {
    // Implement a health check for your data source.
    return {
      status: 'success',
      message: 'Success',
    };
  }
}
