/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import Home from './Home';
import Layout from '../../components/Layout';

async function action({ fetch }) {
  const resp = await fetch('/graphql', {
    body: JSON.stringify({
      query: '{paths{d}}',
    }),
  });
  const { data } = await resp.json();
  if (!data || !data.paths) throw new Error('Failed to load paths.');
  return {
    chunks: ['home'],
    title: 'Shaperator',
    component: (
      <Layout>
        <Home paths={data.paths} />
      </Layout>
    ),
  };
}

export default action;
