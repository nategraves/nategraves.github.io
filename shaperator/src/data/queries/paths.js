/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { GraphQLList as List } from 'graphql';
import fetch from 'node-fetch';
import PathType from '../types/PathType';

// React.js News Feed (RSS)
const url = 'https://41bc3972.ngrok.io';

let returnedPaths = [];
let lastFetchTask;
let lastFetchTime = new Date(1970, 0, 1);

const paths = {
  type: new List(PathType),
  resolve() {
    if (lastFetchTask) {
      return lastFetchTask;
    }

    if (new Date() - lastFetchTime > 1000 * 60 * 10 /* 10 mins */) {
      lastFetchTime = new Date();
      lastFetchTask = fetch(url)
        .then(response => response.json())
        .then(data => {
          debugger;
          if (data.status === 'ok') {
            returnedPaths = data.paths;
          }

          lastFetchTask = null;
          return returnedPaths;
        })
        .catch(err => {
          lastFetchTask = null;
          throw err;
        });

      if (returnedPaths.length) {
        return returnedPaths;
      }

      return lastFetchTask;
    }

    return returnedPaths;
  },
};

export default paths;
