import React, {Component} from 'react';

export default class DTable extends Component {

  render() {
    const {title, headings, rows} = this.props
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
                {row.map((cell, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`}>
                    {Array.isArray(cell)? (
                      <a href={cell[1]}>{cell[0]}</a>
                    ) : (
                      <span>{cell}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
}