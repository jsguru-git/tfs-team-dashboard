import React from 'react';
import ReactDOM from 'react-dom';
import {createBrowserHistory} from 'history';
import {Router, Route} from 'react-router-dom';
import App from './App';
import './index.css';
const history = createBrowserHistory();
ReactDOM.render(
  <Router history={history}>
    <Route exact path="/*" component={App} />
  </Router>,
  document.getElementById('root')
);
