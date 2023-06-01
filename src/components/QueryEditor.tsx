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

import React, { PureComponent } from 'react';
import { Button, InlineField, InlineFieldRow, Select, TagList } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { CosmosDataSource } from '../datasource';
import { CosmosDataSourceOptions, CosmosQuery } from '../types';
import axios from 'axios';

type Props = QueryEditorProps<CosmosDataSource, CosmosQuery, CosmosDataSourceOptions>;

function selectable(value?: string): SelectableValue<string> {
  if (!value) {
    return {};
  }
  return { label: value, value: value };
}

export class QueryEditor extends PureComponent<Props> {
  constructor(props: QueryEditorProps<CosmosDataSource, CosmosQuery, CosmosDataSourceOptions>) {
    super(props);
    const { onChange, query } = this.props;
    if (!query.valueType) {
      query.valueType = 'CONVERTED';
    }
    if (!query.reduced) {
      query.reduced = 'DECOM';
    }
    if (!query.reducedType) {
      query.reducedType = 'AVG';
    }
    if (!query.items) {
      query.items = [];
    }
    onChange({ ...query });
  }

  apiRequest = (method: string, params: string[]) => {
    return this.props.datasource.auth.checkToken().then(() => {
      return axios.post(
        `${this.props.datasource.apiUrl}/openc3-api/api`,
        {
          jsonrpc: '2.0',
          method: method,
          params: params,
          id: 1,
          keyword_params: { scope: this.props.datasource.scope },
        },
        {
          headers: {
            Authorization: this.props.datasource.auth.token(),
            'Content-Type': 'application/json-rpc',
          },
        }
      );
    });
  };

  getTargets = () => {
    const result: Array<SelectableValue<string>> = [];
    this.apiRequest('get_target_list', []).then((response) => {
      response.data.result.forEach((target: string) => {
        result.push({ label: target, value: target });
      });
    });
    return result;
  };
  onTargetChange = (event: SelectableValue<string>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, target: event.value });
  };

  getPackets = () => {
    const result: Array<SelectableValue<string>> = [];
    if (this.props.query.target) {
      this.apiRequest('get_all_telemetry_names', [this.props.query.target]).then((response) => {
        response.data.result.forEach((packet: string) => {
          result.push({ label: packet, value: packet });
        });
      });
    }
    return result;
  };
  onPacketChange = (event: SelectableValue<string>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, packet: event.value });
  };

  getItems = () => {
    const result: Array<SelectableValue<string>> = [];
    if (this.props.query.target && this.props.query.packet) {
      this.apiRequest('get_telemetry', [this.props.query.target, this.props.query.packet]).then((response) => {
        response.data.result.items.forEach((item: any) => {
          result.push({ label: item.name, value: item.name });
        });
      });
    }
    return result;
  };
  onItemChange = (event: SelectableValue<string>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, item: event.value });
  };

  getValueTypes = () => {
    const result: Array<SelectableValue<string>> = [];
    result.push({ label: 'CONVERTED', value: 'CONVERTED' });
    result.push({ label: 'RAW', value: 'RAW' });
    return result;
  };
  onValueTypeChange = (event: SelectableValue<string>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, valueType: event.value });
  };

  getReduced = () => {
    const result: Array<SelectableValue<string>> = [];
    result.push({ label: 'DECOM', value: 'DECOM' });
    result.push({ label: 'REDUCED_MINUTE', value: 'REDUCED_MINUTE' });
    result.push({ label: 'REDUCED_HOUR', value: 'REDUCED_HOUR' });
    result.push({ label: 'REDUCED_DAY', value: 'REDUCED_DAY' });
    return result;
  };
  onReducedChange = (event: SelectableValue<string>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, reduced: event.value });
  };

  getReducedTypes = () => {
    const result: Array<SelectableValue<string>> = [];
    result.push({ label: 'MIN', value: 'MIN' });
    result.push({ label: 'MAX', value: 'MAX' });
    result.push({ label: 'AVG', value: 'AVG' });
    result.push({ label: 'STDDEV', value: 'STDDEV' });
    return result;
  };
  onReducedTypeChange = (event: SelectableValue<string>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, reducedType: event.value });
  };

  onAddItem = () => {
    let key = `${this.props.query.reduced}__TLM__${this.props.query.target}__${this.props.query.packet}__${this.props.query.item}__${this.props.query.valueType}`;
    if (this.props.query.reduced !== 'DECOM') {
      key += `__${this.props.query.reducedType}`;
    }

    this.props.query.items.push(key);
    const { onChange, query } = this.props;
    onChange({
      ...query,
      items: this.props.query.items,
    });
  };

  removeItem = (item: string) => {
    const index = this.props.query.items.indexOf(item);
    this.props.query.items.splice(index, 1);
    const { onChange, query } = this.props;
    onChange({
      ...query,
      items: this.props.query.items,
    });
  };

  render() {
    return (
      <div>
        <InlineFieldRow>
          <InlineField label="Target" labelWidth={15}>
            <Select
              allowCustomValue={true}
              placeholder="target"
              value={selectable(this.props.query.target)}
              options={this.getTargets()}
              onChange={this.onTargetChange}
              width={30}
            />
          </InlineField>
          <InlineField label="Packet" labelWidth={15}>
            <Select
              allowCustomValue={true}
              placeholder="packet"
              value={selectable(this.props.query.packet)}
              options={this.getPackets()}
              onChange={this.onPacketChange}
              width={30}
            />
          </InlineField>
          <InlineField label="Item" labelWidth={15}>
            <Select
              allowCustomValue={true}
              placeholder="item"
              value={selectable(this.props.query.item)}
              options={this.getItems()}
              onChange={this.onItemChange}
              width={30}
            />
          </InlineField>
          <InlineField label="Value Type" labelWidth={15}>
            <Select
              placeholder="valueType"
              value={selectable(this.props.query.valueType)}
              options={this.getValueTypes()}
              onChange={this.onValueTypeChange}
              width={30}
            />
          </InlineField>
          <InlineField label="Decom / Reduced" labelWidth={15}>
            <Select
              placeholder="reduced"
              value={selectable(this.props.query.reduced)}
              options={this.getReduced()}
              onChange={this.onReducedChange}
              width={30}
            />
          </InlineField>
          <InlineField label="Reduced Type" labelWidth={15}>
            <Select
              placeholder="reducedType"
              value={selectable(this.props.query.reducedType)}
              options={this.getReducedTypes()}
              onChange={this.onReducedTypeChange}
              width={30}
            />
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow>
          <InlineField label="Add Item" labelWidth={15}>
            <Button onClick={this.onAddItem}>Add Item</Button>
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow>
          <TagList tags={this.props.query.items} onClick={(item) => this.removeItem(item)} />
        </InlineFieldRow>
      </div>
    );
  }
}
