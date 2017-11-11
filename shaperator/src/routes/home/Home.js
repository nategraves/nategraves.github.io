/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import s from './Home.css';

class Home extends React.Component {
  static propTypes = {
    paths: PropTypes.arrayOf(
      PropTypes.shape({
        d: PropTypes.string.isRequired,
      }),
    ).isRequired,
  };

  render() {
    return (
      <div className={s.root}>
        <div className={s.container}>
          <h1>Shaperator</h1>
          {this.props.paths.map(path => (
            <svg width="350" height="350" viewBox="0 0 350 350">
              <path d={path.d} fill="#121212" />
            </svg>
          ))}
        </div>
      </div>
    );
  }
}

export default withStyles(s)(Home);
