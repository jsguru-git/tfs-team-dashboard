import React, { Component } from 'react';
import DTable from './components/DTable';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      userName: 'Said Alghamidi',
      projects: [['Project 1 Name', '#'], ['Project 2 Name', '#'], ['Project 3 Name', '#']],
      contrTable: {
        title: 'Contribution',
        headings: ['Duration', 'Completed Tasks', 'Commits', 'Successful Builds', 'Failed Builds'],
        rows: [
          ['Last 24 Hours', 16, 11, 8, 2],
          ['Last 24 Hours', 16, 11, 8, 2],
          ['Last 24 Hours', 16, 11, 8, 2],
          ['Last 24 Hours', 16, 11, 8, 2],
        ]
      },
      commTable: {
        title: 'Commits (Last 30 Days)',
        headings: ['Project', 'Commit Id', 'Date', 'Description'],
        rows: [
          [['Project Name', '#'], ['3d3f5', '#'], '12 May 2019 23:12', 'Commit description'],
          [['Project Name', '#'], ['3d3f5', '#'], '12 May 2019 23:12', 'Commit description'],
          [['Project Name', '#'], ['3d3f5', '#'], '12 May 2019 23:12', 'Commit description'],
          [['Project Name', '#'], ['3d3f5', '#'], '12 May 2019 23:12', 'Commit description'],
        ]
      },
      complTable: {
        title: 'Completed Work Items (Last 7 Days)',
        headings: ['Project', 'Work Item Id', 'Date', 'Type', 'Title'],
        rows: [
          [['Project Name', '#'], ['3d3f5', '#'], '12 May 2019 23:12', 'Bug', 'Bug Title'],
          [['Project Name', '#'], ['3d3f5', '#'], '12 May 2019 23:12', 'Bug', 'Bug Title'],
          [['Project Name', '#'], ['3d3f5', '#'], '12 May 2019 23:12', 'Bug', 'Bug Title'],
          [['Project Name', '#'], ['3d3f5', '#'], '12 May 2019 23:12', 'Bug', 'Bug Title'],
        ]
      }
    }
  }
  render() {
    const {userName, projects, contrTable, commTable, complTable} = this.state;
    return (
      <div className="App">
        <div className="container">
          <div className="App-header">
            <img src={logo} className="App-logo" alt="logo" />
            <h2>Welcome to The TFS Team Dashboard</h2>
          </div>
          <div className="App-intro">
            <div className="section-wrapper">
              <p className="info"><span className="title">{userName}</span></p>
              <p className="info">Email: <span>said_alghamidi@hotmail.com</span></p>
              <p className="info">Member of: {
                projects.map((item, index) => {
                  let buffer = []
                  var project = Array.isArray(item)? (<a key={`project-${index}`} href={item[1]}>{item[0]}</a>) : (item);
                  if (index) buffer.push(", ");
                  buffer.push(project)
                  return buffer
                })
              }</p>
            </div>
            <div className="section-wrapper">
              <DTable title={contrTable.title} headings={contrTable.headings} rows={contrTable.rows} />
            </div>
            <div className="section-wrapper">
              <DTable title={commTable.title} headings={commTable.headings} rows={commTable.rows} />
            </div>
            <div className="section-wrapper">
              <DTable title={complTable.title} headings={complTable.headings} rows={complTable.rows} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
