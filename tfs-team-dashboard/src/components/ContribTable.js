import React, {Component} from 'react';

export default class ContribTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
        title: 'Contribution',
        headings: ['Duration', 'Completed Tasks', 'Commits', 'Successful Builds', 'Failed Builds'],
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
                <td>{row.period}</td>
                <td>{row.compltdTasksNum}</td>
                <td>{row.commitsNum}</td>
                <td>{row.sBuilds}</td>
                <td>{row.fBuilds}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
}