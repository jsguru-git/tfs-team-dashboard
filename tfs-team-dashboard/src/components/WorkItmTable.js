import React, {Component} from 'react';
import Moment from 'react-moment';

export default class WorkItmTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
        title: 'Completed Work Items (Last 7 Days)',
        headings: ['Project', 'Work Item Id', 'Date', 'Type', 'Title'],
    }
  }
  render() {
    const {title, headings} = this.state;
    const {rows} = this.props;
    return (
      <div className="Data-table">
        <div className="title">
          <span>{title}:</span>
        </div>
        <table className="table-striped">
          <thead>
            <tr>
              {headings.map((cell, index) => (
                <td key={`heading-${index}`}>{cell}</td>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                <td><a href={row._links.workItemType.href.split('/_apis')[0]}>{row.fields['System.TeamProject']}</a></td>
                <td>
                  <a href={row._links.html.href}>{row.id}</a>
                </td>
                <td><Moment format='D MMM YYYY h:mm'>{row.fields['Microsoft.VSTS.Common.ResolvedDate']}</Moment></td>
                <td>{row.fields['System.WorkItemType']}</td>
                <td>{row.fields['System.Title']}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
}