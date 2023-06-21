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

import React, { ChangeEvent } from 'react';
import { InlineField, Input, SecretInput } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { CosmosDataSourceOptions } from '../types';

interface Props extends DataSourcePluginOptionsEditorProps<CosmosDataSourceOptions> {}

export function ConfigEditor(props: Props) {
  const { onOptionsChange, options } = props;

  const onCosmosUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    const jsonData = {
      ...options.jsonData,
      cosmosUrl: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  const onKeycloakUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    const jsonData = {
      ...options.jsonData,
      keycloakUrl: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  const onClientIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    const jsonData = {
      ...options.jsonData,
      clientId: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  const onRealmChange = (event: ChangeEvent<HTMLInputElement>) => {
    const jsonData = {
      ...options.jsonData,
      realm: event.target.value,
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

  const onUserChange = (event: ChangeEvent<HTMLInputElement>) => {
    const jsonData = {
      ...options.jsonData,
      username: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  const onPasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    const jsonData = {
      ...options.jsonData,
      password: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
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
  jsonData.cosmosUrl ||= 'http://localhost:2900';
  jsonData.keycloakUrl ||= 'http://localhost:2900/auth';
  jsonData.clientId ||= 'api';
  jsonData.realm ||= 'openc3';
  jsonData.scope ||= 'DEFAULT';

  return (
    <div className="gf-form-group">
      <InlineField label="Scope" labelWidth={17}>
        <Input onChange={onScopeChange} defaultValue={jsonData.scope} placeholder="Scope" width={40} />
      </InlineField>
      <InlineField label="COSMOS Root URL" labelWidth={17}>
        <Input onChange={onCosmosUrlChange} defaultValue={jsonData.cosmosUrl} placeholder="COSMOS API URL" width={40} />
      </InlineField>
      <InlineField label="Keycloak Root URL" labelWidth={17}>
        <Input
          onChange={onKeycloakUrlChange}
          defaultValue={jsonData.keycloakUrl}
          placeholder="Keycloak URL"
          width={40}
        />
      </InlineField>
      <InlineField label="Keycloak Client ID" labelWidth={17}>
        <Input
          onChange={onClientIdChange}
          defaultValue={jsonData.clientId}
          placeholder="Keycloak Client ID"
          width={40}
        />
      </InlineField>
      <InlineField label="Keycloak Realm" labelWidth={17}>
        <Input onChange={onRealmChange} defaultValue={jsonData.realm} placeholder="Keycloak Realm" width={40} />
      </InlineField>
      <InlineField label="Username" labelWidth={17}>
        <Input
          onChange={onUserChange}
          value={jsonData.username}
          placeholder="Username (Leave blank for Open Source Edition)"
          width={40}
        />
      </InlineField>
      <InlineField label="Password" labelWidth={17}>
        <SecretInput
          isConfigured={(secureJsonFields && secureJsonFields.password) as boolean}
          value={jsonData.password}
          placeholder="Password"
          width={40}
          onReset={onPasswordReset}
          onChange={onPasswordChange}
        />
      </InlineField>
    </div>
  );
}
