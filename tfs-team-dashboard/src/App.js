import React, { Component } from 'react';
import DTable from './components/DTable';
import ContribTable from './components/ContribTable';
import CommitTable from './components/CommitTable';
import WorkItmTable from './components/WorkItmTable';
import axios from 'axios';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      userName: 'Said Alghamidi',
      projects: [],
      // contrTable: {
      //   title: 'Contribution',
      //   headings: ['Duration', 'Completed Tasks', 'Commits', 'Successful Builds', 'Failed Builds'],
      //   rows: [
      //     ['Last 24 Hours', 16, 11, 8, 2],
      //     ['Past Week', 16, 11, 8, 2],
      //     ['Past Month', 16, 11, 8, 2],
      //     ['Past Year', 16, 11, 8, 2],
      //   ]
      // },
      contribTableRows: [],
      commTableRows: [],
      complTableRows: [],
    }
  }
  base64EncodedPAT(userName, pat) {
    let rawData = `${userName}:${pat}`;
    let buff = new Buffer(rawData);
    let base64Data = buff.toString('base64');
    return base64Data
  }
  taskWiqlGenerator(period) {
    const wiql = `SELECT [System.Id], [System.Title], [System.AssignedTo], [Microsoft.VSTS.Common.Priority], [Microsoft.VSTS.Scheduling.RemainingWork], [Microsoft.VSTS.Scheduling.CompletedWork], [Microsoft.VSTS.Scheduling.OriginalEstimate] 
                  FROM WorkItems 
                  WHERE 
                    [System.TeamProject] = @project AND 
                    [System.WorkItemType] = 'Task' AND 
                    [System.State] = 'Closed' AND
                    [Microsoft.VSTS.Common.ClosedDate] > @today - ${period} AND
                    [System.AssignedTo] = @me`;
    return wiql;
  }
  async getCommits(repoArr, criteriaObj) {
    const commitsArr2d = await Promise.all(
      repoArr.map(function(repo) {
        return axios.get(`http://jsguru-tfs/DefaultCollection/${repo.project.id}/_apis/git/repositories/${repo.id}/commits`,
            {
              params: {
                'api-version': 4.1,
                ...criteriaObj
              }
            }
          ).then((res) => { 
            return res.data.value.map((commit) => {
              commit.projectName = repo.project.name;
              commit.projectUrl = repo.project.url.replace('/_apis/projects', '');
              return commit;
            })
          })
      })
    );
    const commits = [].concat(...commitsArr2d);
    return commits;
  }
  async getWorkItems(projArr, wiql) {
    const workItemsArr2d = await Promise.all(
      projArr.map(function(project) {
        return axios.post(`http://jsguru-tfs/DefaultCollection/${project.id}/_apis/wit/wiql`,
            {
              query: wiql
            },
            {
              params: {
                'api-version': 4.1
              }
            }
          ).then((res) => res.data.workItems)
      })
    );

    const workItems = [].concat(...workItemsArr2d)
    return workItems;
  }
  async componentDidMount() {
    var self = this;
    let uName = "";
    let pat = "iegwlaffn5lc4suuhzsbvwsysr7qzgya7pn4ybqppbgdjxrevsmq";
    let base64Token = self.base64EncodedPAT(uName, pat);
    axios.defaults.headers = {
      'Content-Type': 'application/json',
      Authorization: `Basic ${base64Token}`
    }

    // Fetch All Projects Which Working On
    let response = await axios.get('http://jsguru-tfs/DefaultCollection/_apis/projects',
        {
          params: {
            'api-version': 4.1
          }
        }
      );
    let projects = response.data.value;
    projects = projects.map((proj) => {
      proj.projectUrl = proj.url.replace('/_apis/projects', '');
      return proj;
    });

    let contribTblData = [
                          {period: 'Last 24 Hours', sBuilds: 8, fBuilds: 2},
                          {period: 'Past Week', sBuilds: 8, fBuilds: 2},
                          {period: 'Last 24 Hours', sBuilds: 8, fBuilds: 2},
                          {period: 'Last 24 Hours', sBuilds: 8, fBuilds: 2}
                        ];
    // Fetch Completed Tasks
    const periodArr = [1, 7, 30, 365];
    const compltdTasksArr2d = await Promise.all(
      periodArr.map((period) => {
        let wiql = self.taskWiqlGenerator(period);
        return self.getWorkItems(projects, wiql);
      })
    );
    compltdTasksArr2d.map((tasksArr, index) => {
      contribTblData[index].compltdTasksNum = tasksArr.length;
      console.log(`CompltdTask In ${periodArr[index]} days`, tasksArr.length); 
    });

    // Fetch All Repositories.
    const reposArr2d = await Promise.all(
      projects.map(function(project) {
        return axios.get(`http://jsguru-tfs/DefaultCollection/${project.id}/_apis/git/repositories`,
            {
              params: {
                'api-version': 4.1
              }
            }
          ).then((res) => res.data.value)    
      })
    );

    const repositories = [].concat(...reposArr2d);
    
    // Fetch commits
    // ** Last 24 hours
    const today = new Date();
    let yesterday = new Date(today.getTime());
    yesterday.setDate(today.getDate() - 1);

    let lastWeekToday = new Date(today.getTime());
    lastWeekToday.setDate(today.getDate() - 7);

    let lastMonthToday = new Date(today.getTime());
    lastMonthToday.setMonth(today.getMonth() - 1);

    let lastYearToday = new Date(today.getTime());
    lastYearToday.setFullYear(today.getFullYear() - 1);

    const timeStampArr = [yesterday, lastWeekToday, lastMonthToday, lastYearToday];
    
    const commitArr2d = await Promise.all(
      timeStampArr.map((timeStamp) => {
        const searchTerms = {
          'searchCriteria.fromDate': timeStamp.toISOString()
        }
        return self.getCommits(repositories, searchTerms);
      })
    );
    commitArr2d.map((commits, index) => {
      contribTblData[index].commitsNum = commits.length;
        console.log(`commits from ${timeStampArr[index].toISOString()}`, commits);  
    });

    // Completed Work Items
    // ** Last 7 Days
    const compltdWItems_In_7_days_wiql = `SELECT [System.Id],[System.WorkItemType],[System.Title],[System.AssignedTo],[System.State],[System.Tags] 
                                          FROM WorkItems 
                                          WHERE 
                                            [System.TeamProject] = @project AND 
                                            [System.WorkItemType] <> '' AND 
                                            [System.State] = 'Closed' AND 
                                            [Microsoft.VSTS.Common.ClosedDate] > @today - 7 AND 
                                            [System.AssignedTo] = @me`
    const workItems = await self.getWorkItems(projects, compltdWItems_In_7_days_wiql);

    console.log("Last 7 days work items", workItems);

    // ** Get Details of Work Items
    const workItemsInfos = await Promise.all(
      workItems.map(function(workItem) {
        return axios.get(workItem.url,
            {
              params: {
                'api-version': 4.1
              }
            }
          ).then((res) => res.data)
      })
    );
    console.log("work items details", workItemsInfos);

    self.setState({
      projects: projects,
      contribTableRows: contribTblData,
      commTableRows: commitArr2d[2],
      complTableRows: workItemsInfos
    });
  }
  render() {
    const {userName, projects, contribTableRows, commTableRows, complTableRows} = this.state;
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
                  var project = <a key={`project-${index}`} href={item.projectUrl}>{item.name}</a>;
                  if (index) buffer.push(", ");
                  buffer.push(project)
                  return buffer
                })
              }</p>
            </div>
            <div className="section-wrapper">
              {/* <DTable title={contrTable.title} headings={contrTable.headings} rows={contrTable.rows} /> */}
              <ContribTable rows={contribTableRows} />
            </div>
            <div className="section-wrapper">
              <CommitTable rows={commTableRows} />
            </div>
            <div className="section-wrapper">
              <WorkItmTable rows={complTableRows} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
