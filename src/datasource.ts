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
  cable: any;
  url: string;
  scope: string;
  password: string;

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
    this.url = instanceSettings.jsonData.url;
    this.scope = instanceSettings.jsonData.scope;
    this.password = instanceSettings.jsonData.password;
  }

  query(options: DataQueryRequest<MyQuery>): Observable<DataQueryResponse> {
    // console.log(options);
    // console.log(options.range.from.utc());
    // console.log(options.range.to.utc());
    const observables = options.targets.map((target) => {
      const query = defaults(target, defaultQuery);
      return new Observable<DataQueryResponse>((subscriber) => {
        this.cable = ActionCable.createConsumer(
          `ws:${this.url}/openc3-api/cable?scope=${this.scope}
            &authorization=${this.password}`
        );

        const frame = new CircularDataFrame({
          append: 'tail',
          capacity: query.capacity || 3600,
        });
        let item = query.item.split(' ').join('__');
        console.log(item);

        let key = `DECOM__TLM__${item}__CONVERTED`;
        let items: string[][] = [];
        items.push([key, '0']);
        let endTime: any = null;
        let state = LoadingState.Streaming;
        if (options.liveStreaming === false) {
          endTime = options.range.to * 1_000_000;
          state = LoadingState.Done;
        }

        let subscription = this.cable.subscriptions.create(
          { channel: 'StreamingChannel' },
          {
            connected() {
              frame.addField({ name: 'time', type: FieldType.time });
              frame.addField({ name: 'TEMP1', type: FieldType.number });

              subscription.perform('add', {
                scope: 'DEFAULT',
                token: 'password',
                items: items,
                start_time: options.range.from * 1_000_000,
                end_time: endTime,
              });
            },
            received: (data: any) => {
              data.forEach((item: any) => {
                frame.add({ time: item['__time'] / 1_000_000, TEMP1: item['0'] });
              });

              subscriber.next({
                data: [frame],
                key: query.refId,
                state: state,
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
