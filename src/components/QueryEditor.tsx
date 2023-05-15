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
    query.items = [];
    onChange({ ...query });
  }

  apiRequest = (method: string, params: string[]) => {
    return axios.post(
      `http://${this.props.datasource.url}/openc3-api/api`,
      {
        jsonrpc: '2.0',
        method: method,
        params: params,
        id: 1,
        keyword_params: { scope: 'DEFAULT' },
      },
      {
        headers: {
          Authorization: this.props.datasource.password,
          'Content-Type': 'application/json-rpc',
        },
      }
    );
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
    this.apiRequest('get_all_telemetry_names', [this.props.query.target || '']).then((response) => {
      response.data.result.forEach((packet: string) => {
        result.push({ label: packet, value: packet });
      });
    });
    return result;
  };
  onPacketChange = (event: SelectableValue<string>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, packet: event.value });
  };

  getItems = () => {
    const result: Array<SelectableValue<string>> = [];
    this.apiRequest('get_telemetry', [this.props.query.target || '', this.props.query.packet || '']).then(
      (response) => {
        response.data.result.items.forEach((item: any) => {
          result.push({ label: item.name, value: item.name });
        });
      }
    );
    return result;
  };
  onItemChange = (event: SelectableValue<string>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, item: event.value });
  };

  onAddItem = () => {
    this.props.query.items.push(`${this.props.query.target}__${this.props.query.packet}__${this.props.query.item}`);
    const { onChange, query } = this.props;
    onChange({
      ...query,
      items: this.props.query.items,
    });
  };

  render() {
    this.props.query.queryType = 'query';
    return (
      <div>
        <InlineFieldRow>
          <InlineField label="Target" labelWidth={30}>
            <Select
              allowCustomValue={true}
              placeholder="target"
              value={selectable(this.props.query.target)}
              options={this.getTargets()}
              onChange={this.onTargetChange}
              width={90}
            />
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow>
          <InlineField label="Packet" labelWidth={30}>
            <Select
              allowCustomValue={true}
              placeholder="packet"
              value={selectable(this.props.query.packet)}
              options={this.getPackets()}
              onChange={this.onPacketChange}
              width={90}
            />
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow>
          <InlineField label="Item" labelWidth={30}>
            <Select
              allowCustomValue={true}
              placeholder="item"
              value={selectable(this.props.query.item)}
              options={this.getItems()}
              onChange={this.onItemChange}
              width={90}
            />
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow>
          <InlineField label="Add" labelWidth={30}>
            <Button onClick={this.onAddItem}>Add Item</Button>
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow>
          <TagList tags={this.props.query.items} onClick={(item) => console.log(item)} />
        </InlineFieldRow>
      </div>
    );
  }
}
