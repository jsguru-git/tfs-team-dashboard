import React, { Component } from 'react';
import ReactToPrint from 'react-to-print';
import ContribTable from './components/ContribTable';
import CommitTable from './components/CommitTable';
import WorkItmTable from './components/WorkItmTable';
import * as qs from 'query-string';
import axios from 'axios';
import logo from './logo.svg';
import './App.css';
import {tfsUrl,PAT, gitUser} from './user-infos.js';

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      userName: '',
      userEmail: '',
      projects: [],
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
  async getUserProfile() {
    const response = await axios.get(`${tfsUrl}/DefaultCollection/_api/_common/GetUserProfile?__v=5`);
    let name = response.data.providerDisplayName;
    let email = response.data.userPreferences.PreferredEmail;
    return {name, email};
  }
  async getProjects(collectionArr) {
    const projArr2d = await Promise.all(
      collectionArr.map(function(collection) {
        // [API format]: http://{instance}/{collectionName}/_apis/projects
        return axios.get(`${tfsUrl}/${collection.name}/_apis/projects`,
            {
              params: {
                'api-version': 4.1
              }
            }
          ).then((res) => {
            return res.data.value.map((proj) => {
              proj.projectUrl = proj.url.replace('/_apis/projects', '');
              return proj;
            });
          });
      })
    );
    const projects = [].concat(...projArr2d);
    return projects;
  }
  async getBuilds(projectArr, criteriaObj) {
    const buildArr2d = await Promise.all(
      projectArr.map(function(project) {
        // [API format]: http://{instance}/{collectionName}/{projectId}/_apis/build/builds
        return axios.get(`${project.projectUrl}/_apis/build/builds`,
            {
              params: {
                'api-version': 4.1,
                ...criteriaObj
              }
            }
          ).then((res) => res.data.value)    
      })
    );

    const builds = [].concat(...buildArr2d);
    return builds;
  }
  async getCommits(repoArr, criteriaObj) {
    const commitsArr2d = await Promise.all(
      repoArr.map(function(repo) {
        // [API format]: http://{instance}/{collectionName}/{projectId}/_apis/git/repositories/{repositoryId}/commits
        return axios.get(repo.url.replace('/_apis', `/${repo.project.id}/_apis`) + '/commits',
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
        // [API format]: http://{instance}/{collectionName}/{projectId}/_apis/wit/wiql
        return axios.post(`${project.projectUrl}/_apis/wit/wiql`,
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
    var params = qs.parse(self.props.location.search);
    var user = params.user;
    if (!user) {
      alert("User name must be specifed as url param. For example, ?user=jsguru");
      return;
    }
    let pat = PAT[user];
    if (!pat) {
      alert(`User '${user}' is not member of our TFS.`);
      return;
    }
    // Set PAT into request header.
    let uName = "";
    let base64Token = self.base64EncodedPAT(uName, pat);
    axios.defaults.headers = {
      'Content-Type': 'application/json',
      Authorization: `Basic ${base64Token}`
    }
    // Get User Profile
    let userInfo = await self.getUserProfile();
    console.log("userInfo", userInfo);
    // Fetch All Collections the user has access to.
    let collection_res = await axios.get(`${tfsUrl}/_api/_common/GetJumpList?showTeamsOnly=false&__v=5&navigationContextPackage={}&showStoppedCollections=true`);
    let collections = collection_res.data['__wrappedArray']
    console.log("collections", collections);
    
    // Fetch All Projects Which Working On
    let projects = await self.getProjects(collections);
    console.log("All projects", projects);

    let contribTblData = [
                          {period: 'Last 24 Hours'},
                          {period: 'Past Week'},
                          {period: 'Past Month'},
                          {period: 'Past Year'}
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
        // [API format]: http://{instance}/{collectionName}/{projectId}/_apis/git/repositories
        return axios.get(`${project.projectUrl}/_apis/git/repositories`,
            {
              params: {
                'api-version': 4.1
              }
            }
          ).then((res) => res.data.value)    
      })
    );

    const repositories = [].concat(...reposArr2d);
    console.log("All repositories", repositories);
    // Fetch commits
    // ** Last 24 hours
    const today = new Date();
    let yesterday = new Date(today.getTime());
    yesterday.setDate(today.getDate() - 1);
    // ** Past Week
    let lastWeekToday = new Date(today.getTime());
    lastWeekToday.setDate(today.getDate() - 7);
    // ** Past Month
    let lastMonthToday = new Date(today.getTime());
    lastMonthToday.setMonth(today.getMonth() - 1);
    // ** Past Year
    let lastYearToday = new Date(today.getTime());
    lastYearToday.setFullYear(today.getFullYear() - 1);

    const timeStampArr = [yesterday, lastWeekToday, lastMonthToday, lastYearToday];
    let author = gitUser[user]? gitUser[user] : "";
    
    // Fetch Commits by author and fromDate for Repositories.
    const commitArr2d = await Promise.all(
      timeStampArr.map((timeStamp) => {
        let searchTerms = {
          'searchCriteria.fromDate': timeStamp.toISOString(),
          'searchCriteria.author': author
        }
        return self.getCommits(repositories, searchTerms);
      })
    );
    commitArr2d.map((commits, index) => {
      contribTblData[index].commitsNum = commits.length;
      console.log(`commits from ${timeStampArr[index].toISOString()}`, commits);  
    });

    // Fetch Builds by minTime and resultsFilter for Projects.
    const buildArr3d = await Promise.all(
      timeStampArr.map((timeStamp) => {
        return Promise.all(
          ['succeeded', 'failed'].map((result) => {
            let searchTerms = {
              'resultFilter': result,
              'minTime': timeStamp.toISOString()
            }
            return self.getBuilds(projects, searchTerms);
          })
        );
      })
    );
    buildArr3d.map((buildArr2d, index) => {
      contribTblData[index].sBuilds = buildArr2d[0].length;
      contribTblData[index].fBuilds = buildArr2d[1].length;
      console.log(`succeeded builds from ${timeStampArr[index].toISOString()}`, buildArr2d[0]);
      console.log(`failed builds from ${timeStampArr[index].toISOString()}`, buildArr2d[1]);
    })

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
      userName: userInfo.name,
      userEmail: userInfo.email,
      projects: projects,
      contribTableRows: contribTblData,
      commTableRows: commitArr2d[2],
      complTableRows: workItemsInfos
    });
  }
  render() {
    const {userName, userEmail, projects, contribTableRows, commTableRows, complTableRows} = this.state;
    return (
      <div className="App">
        <div className="container">
          <div className="App-header">
            <img src={logo} className="App-logo" alt="logo" />
            <h2>Welcome to The TFS Team Dashboard</h2>
          </div>
          <div className="App-print">
            <ReactToPrint
              trigger={() => <a href="#">Print this out!</a>}
              content={() => this.printAreaRef}
            />
          </div>
          <div className="App-intro" ref={el => (this.printAreaRef = el)}>
            <div className="section-wrapper">
              <p className="info"><span className="title">{userName}</span></p>
              <p className="info">Email: <span>{userEmail}</span></p>
              <p className="info">Member of: {
                projects.map((item, index) => {
                  let buffer = []
                  var project = <a key={`project-${index}`} href={item.projectUrl} target="_blank">{item.name}</a>;
                  if (index) buffer.push(", ");
                  buffer.push(project)
                  return buffer
                })
              }</p>
            </div>
            <div className="section-wrapper">
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
