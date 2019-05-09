import { createElement } from 'react';
import ReactDOM from 'react-dom';

ReactDOM.render(
  createElement(require('./App.jsx').default),
  document.getElementById('app')
);
