// Copyright 2023 OpenC3, Inc.
// All Rights Reserved.
//
// This program is free software; you can modify and/or redistribute it
// under the terms of the GNU Affero General Public License
// as published by the Free Software Foundation; version 3 with
// attribution addendums as found in the LICENSE.txt
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// This file may also be used under the terms of a commercial license
// if purchased from OpenC3, Inc.

import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  CircularDataFrame,
  FieldType,
  LoadingState,
} from '@grafana/data';
import { Observable, merge } from 'rxjs';

import { CosmosQuery, CosmosDataSourceOptions } from './types';
import * as ActionCable from '@rails/actioncable';
import axios from 'axios';

// Some ideas borrowed from https://github.com/HadesArchitect/GrafanaCassandraDatasource
export class CosmosDataSource extends DataSourceApi<CosmosQuery, CosmosDataSourceOptions> {
  cable: any;
  url: string;
  scope: string;
  password: string;

  constructor(instanceSettings: DataSourceInstanceSettings<CosmosDataSourceOptions>) {
    super(instanceSettings);
    this.url = instanceSettings.jsonData.url;
    this.scope = instanceSettings.jsonData.scope;
    this.password = instanceSettings.jsonData.password;
  }

  query(options: DataQueryRequest<CosmosQuery>): Observable<DataQueryResponse> {
    const observables = options.targets.map((target) => {
      return new Observable<DataQueryResponse>((subscriber) => {
        this.cable = ActionCable.createConsumer(
          `ws:${this.url}/openc3-api/cable?scope=${this.scope}
            &authorization=${this.password}`
        );

        console.log(options.range);
        console.log();
        const frame = new CircularDataFrame({
          append: 'tail',
          capacity: Number(options.range.to.format('x')) - Number(options.range.from.format('x')) / 1000,
        });

        let subscriptionItems: string[][] = [];
        target.items.forEach((item: string, i: number) => {
          let key = `DECOM__TLM__${item}__CONVERTED`;
          subscriptionItems.push([key, i.toString()]);
        });

        let endTime: any = null;
        let state = LoadingState.Streaming;
        if (options.liveStreaming === false) {
          endTime = Number(options.range.to.format('x')) * 1_000_000;
          state = LoadingState.Done;
        }

        let subscription = this.cable.subscriptions.create(
          { channel: 'StreamingChannel' },
          {
            connected() {
              frame.addField({ name: 'time', type: FieldType.time });
              target.items.forEach((item: string) => {
                frame.addField({ name: item, type: FieldType.number });
              });

              subscription.perform('add', {
                scope: 'DEFAULT',
                token: 'password',
                items: subscriptionItems,
                start_time: Number(options.range.from.format('x')) * 1_000_000,
                end_time: endTime,
              });
            },
            received: (data: any) => {
              data.forEach((item: any) => {
                let frameData: any = { time: item['__time'] / 1_000_000 };
                subscriptionItems.forEach(([key, index]) => {
                  frameData[target.items[Number(index)]] = item[index];
                });
                frame.add(frameData);
              });

              subscriber.next({
                data: [frame],
                key: target.refId,
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
    let result = {};
    await axios
      .post(
        `http://${this.url}/openc3-api/api`,
        {
          jsonrpc: '2.0',
          method: 'get_target_list',
          params: [],
          id: 1,
          keyword_params: { scope: 'DEFAULT' },
        },
        {
          headers: {
            Authorization: this.password,
            'Content-Type': 'application/json-rpc',
          },
        }
      )
      .then((response) => {
        result = {
          status: 'success',
          message: response.statusText,
        };
      })
      .catch((error) => {
        result = {
          status: 'error',
          message: error.message,
        };
      });
    return result;
  }
}
