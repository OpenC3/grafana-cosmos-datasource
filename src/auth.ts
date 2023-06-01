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

import axios from 'axios';

// Some ideas borrowed from https://github.com/HadesArchitect/GrafanaCassandraDatasource
export class Auth {
  username: string;
  password: string;
  url: string;
  realm: string;
  clientId: string;

  constructor(username: string, password: string, url: string, realm: string, clientId: string) {
    this.username = username;
    this.password = password;
    this.url = url;
    this.realm = realm;
    this.clientId = clientId;
  }

  token = (): string => {
    if (this.username) {
      return localStorage.openc3Token;
    } else {
      return this.password;
    }
  };

  login = async () => {
    if (this.username) {
      const params = new URLSearchParams();
      params.append('username', this.username);
      params.append('password', this.password);
      params.append('client_id', this.clientId);
      params.append('grant_type', 'password');
      params.append('scope', 'openid');
      return await axios
        .post(`${this.url}/realms/${this.realm}/protocol/openid-connect/token`, params)
        .then((response) => {
          localStorage.openc3Token = response.data.access_token;
          localStorage.openc3RefreshToken = response.data.refresh_token;
        })
        .catch((error) => {
          console.log(error);
          throw error;
        });
    }
  };

  checkToken = (): Promise<void> => {
    if (this.username) {
      let base64Url = localStorage.openc3Token.split('.')[1];
      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      let jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
      let parsed = JSON.parse(jsonPayload);
      // If the expiration time is less than 30s away
      if (parsed.exp + 30 < Date.now() / 1000) {
        return this.login();
      }
    }
    return new Promise((resolve) => {
      resolve();
    });
  };
}
