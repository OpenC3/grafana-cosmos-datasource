import React, { ChangeEvent } from 'react';
import { InlineField, Input, SecretInput } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { MyDataSourceOptions } from '../types';

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> {}

export function ConfigEditor(props: Props) {
  const { onOptionsChange, options } = props;

  const onUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    const jsonData = {
      ...options.jsonData,
      url: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  const onScopeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const jsonData = {
      ...options.jsonData,
      scope: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  const onPasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    const jsonData = {
      ...options.jsonData,
      password: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
    // onOptionsChange({
    //   ...options,
    //   jsonData: {
    //     ...options.jsonData,
    //     password: event.target.value,
    //   },
    // });
  };

  const onPasswordReset = () => {
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...options.secureJsonFields,
        password: false,
      },
      jsonData: {
        ...options.jsonData,
        password: '',
      },
    });
  };

  const { jsonData, secureJsonFields } = options;

  return (
    <div className="gf-form-group">
      <InlineField label="URL" labelWidth={12}>
        <Input
          onChange={onUrlChange}
          value={jsonData.url || 'localhost:2900'}
          placeholder="Base COSMOS URL"
          width={40}
        />
      </InlineField>
      <InlineField label="Scope" labelWidth={12}>
        <Input onChange={onScopeChange} value={jsonData.scope || 'DEFAULT'} placeholder="COSMOS Scope" width={40} />
      </InlineField>
      <InlineField label="Password" labelWidth={12}>
        <SecretInput
          isConfigured={(secureJsonFields && secureJsonFields.password) as boolean}
          value={jsonData.password || ''}
          placeholder="COSMOS password"
          width={40}
          onReset={onPasswordReset}
          onChange={onPasswordChange}
        />
      </InlineField>
    </div>
  );
}
