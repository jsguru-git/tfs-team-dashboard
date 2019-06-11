import React, {Component} from 'react';
import TextTruncate from 'react-text-truncate';
import ReactTooltip from 'react-tooltip'
import Moment from 'react-moment';

export default class CommitTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: 'Commits (Last 30 Days)',
      headings: ['Project', 'Commit Id', 'Date', 'Description']
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
                <td><a href={row.projectUrl}>{row.projectName}</a></td>
                <td>
                  <a href={row.remoteUrl} data-tip data-for={`commitId-${rowIndex}`}>
                    <TextTruncate 
                      line={1}
                      truncateText="..."
                      text={row.commitId}
                    />
                  </a>
                  <ReactTooltip id={`commitId-${rowIndex}`} type='info' effect='solid'>{row.commitId}</ReactTooltip>
                </td>
                <td><Moment format='D MMM YYYY h:mm'>{row.committer.date}</Moment></td>
                <td>
                  <span data-tip data-for={`comment-${rowIndex}`}>
                    <TextTruncate 
                      line={1}
                      truncateText="..."
                      text={row.comment}
                    />
                  </span>
                  <ReactTooltip id={`comment-${rowIndex}`} type='info' effect='solid'>{row.comment}</ReactTooltip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
}