// import defaults from 'lodash/defaults';
import React, { ChangeEvent } from 'react';
import { InlineField, Input } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from '../datasource';
import { MyDataSourceOptions, MyQuery } from '../types';

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export function QueryEditor({ query, onChange, onRunQuery }: Props) {
  const onCapacityChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...query, capacity: parseInt(event.target.value, 10) });
    // executes the query
    onRunQuery();
  };

  const { capacity } = query;

  return (
    <div className="gf-form">
      <InlineField label="Capacity">
        <Input onChange={onCapacityChange} value={capacity} width={8} type="number" step="100" />
      </InlineField>
    </div>
  );
}
