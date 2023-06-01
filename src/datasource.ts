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
import axios, { AxiosError } from 'axios';
import { Auth } from 'auth';

// Some ideas borrowed from https://github.com/HadesArchitect/GrafanaCassandraDatasource
export class CosmosDataSource extends DataSourceApi<CosmosQuery, CosmosDataSourceOptions> {
  cable: any;
  apiUrl: string;
  host: string;
  scope: string;
  auth: Auth;

  constructor(instanceSettings: DataSourceInstanceSettings<CosmosDataSourceOptions>) {
    super(instanceSettings);
    this.apiUrl = instanceSettings.jsonData.cosmosUrl;
    this.host = instanceSettings.jsonData.cosmosUrl.split('//')[1];
    this.scope = instanceSettings.jsonData.scope;
    this.auth = new Auth(
      instanceSettings.jsonData.username,
      instanceSettings.jsonData.password,
      instanceSettings.jsonData.keycloakUrl,
      instanceSettings.jsonData.realm,
      instanceSettings.jsonData.clientId
    );
  }

  query(options: DataQueryRequest<CosmosQuery>): Observable<DataQueryResponse> {
    const observables = options.targets.map((target) => {
      return new Observable<DataQueryResponse>((subscriber) => {
        this.auth.checkToken().then(() => {
          let token = this.auth.token();
          this.cable = ActionCable.createConsumer(
            `ws:${this.host}/openc3-api/cable?scope=${this.scope}
          &authorization=${token}`
          );

          const frame = new CircularDataFrame({
            append: 'tail',
            capacity: Number(options.range.to.format('x')) - Number(options.range.from.format('x')) / 1000,
          });

          let subscriptionItems: string[][] = [];
          target.items.forEach((item: string, i: number) => {
            subscriptionItems.push([item, i.toString()]);
          });

          let endTime: any = null;
          let state = LoadingState.Streaming;
          if (options.liveStreaming === false) {
            endTime = Number(options.range.to.format('x')) * 1_000_000;
            state = LoadingState.Done;
          }

          let scope = this.scope;
          let subscription = this.cable.subscriptions.create(
            { channel: 'StreamingChannel' },
            {
              connected() {
                frame.addField({ name: 'time', type: FieldType.time });
                target.items.forEach((item: string) => {
                  frame.addField({ name: item, type: FieldType.number });
                });

                subscription.perform('add', {
                  scope: scope,
                  token: token,
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
    });
    return merge(...observables);
  }

  async testDatasource() {
    let result = {};
    try {
      await this.auth.login();
      await axios
        .post(
          `${this.apiUrl}/openc3-api/api`,
          {
            jsonrpc: '2.0',
            method: 'get_target_list',
            params: [],
            id: 1,
            keyword_params: { scope: this.scope },
          },
          {
            headers: {
              Accept: 'application/json',
              Authorization: this.auth.token(),
              'Content-Type': 'application/json-rpc',
            },
          }
        )
        .then((response) => {
          result = {
            status: 'success',
            message: response.statusText,
          };
        });
    } catch (error: any | AxiosError) {
      let message = error.message;
      // Check if this is an axios error thrown from auth.login()
      if (axios.isAxiosError(error)) {
        console.log(error);
        if (error.response && error.response.data) {
          const data: any = error.response.data;
          // Base COSMOS provides status in data.error.message
          if (data.error && data.error.message) {
            message += `, ${data.error.message}`;
            // Enterprise COSMOS provides status in data.error_description
          } else if (data.error_description) {
            message += `, ${data.error_description}`;
          }
        }
      }
      result = {
        status: 'error',
        message: message,
      };
    }

    return result;
  }
}
