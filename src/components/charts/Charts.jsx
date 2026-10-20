/**
 * Small chart components drawn with SVG and CSS (no chart library).
 * Each chart has a text summary for screen readers and a "Show data"
 * button that reveals the exact numbers in a table.
 */

import { useId, useState } from 'react';

function DataTable({ caption, rows, columns }) {
  return (
    <table className="data-table data-table--compact">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column} scope="col">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row[0]}>
            <th scope="row">{row[0]}</th>
            <td>{row[1]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ChartFrame({ title, summary, rows, columns, children }) {
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();
  return (
    <figure className="chart">
      <figcaption className="chart__header">
        <span className="chart__title">{title}</span>
        <button
          type="button"
          className="button button--ghost button--sm"
          aria-expanded={showTable}
          aria-controls={tableId}
          onClick={() => setShowTable((value) => !value)}
        >
          {showTable ? 'Show chart' : 'Show data'}
        </button>
      </figcaption>
      <p className="sr-only">{summary}</p>
      <div id={tableId}>{showTable ? <DataTable caption={title} rows={rows} columns={columns} /> : children}</div>
    </figure>
  );
}

/** Rounds a maximum up to a tidy number for the axis (5, 10, 20, 50…). */
function niceMax(value) {
  if (value <= 5) return 5;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const steps = [1, 2, 5, 10];
  return steps.map((step) => step * magnitude).find((step) => step >= value) ?? value;
}

/** Vertical bar chart, used for "reservations per day". */
export function ColumnChart({ title, data, valueLabel }) {
  const width = 640;
  const height = 240;
  const padding = { top: 16, right: 8, bottom: 36, left: 36 };
  const max = niceMax(Math.max(1, ...data.map((item) => item.value)));
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const band = innerWidth / data.length;
  const barWidth = Math.min(28, band * 0.62);
  const ticks = [0, max / 2, max];

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const busiest = data.reduce((best, item) => (item.value > best.value ? item : best), data[0] ?? { value: 0 });
  const summary = `${total} ${valueLabel} in total. The busiest day was ${busiest?.label} with ${busiest?.value}.`;

  return (
    <ChartFrame
      title={title}
      summary={summary}
      columns={['Day', valueLabel]}
      rows={data.map((item) => [item.fullLabel ?? item.label, item.value])}
    >
      <svg className="column-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={summary}>
        {ticks.map((tick) => {
          const y = padding.top + innerHeight - (tick / max) * innerHeight;
          return (
            <g key={tick}>
              <line className="chart-gridline" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
              <text className="chart-label" x={padding.left - 8} y={y + 4} textAnchor="end">
                {tick}
              </text>
            </g>
          );
        })}
        {data.map((item, index) => {
          const barHeight = (item.value / max) * innerHeight;
          const x = padding.left + index * band + (band - barWidth) / 2;
          const y = padding.top + innerHeight - barHeight;
          return (
            <g key={item.label + index}>
              <rect className={`chart-bar ${item.highlight ? 'chart-bar--highlight' : ''}`} x={x} y={y} width={barWidth} height={Math.max(barHeight, 1)} rx="4">
                <title>{`${item.fullLabel ?? item.label}: ${item.value}`}</title>
              </rect>
              {index % 2 === 0 || data.length <= 8 ? (
                <text className="chart-label" x={x + barWidth / 2} y={height - 14} textAnchor="middle">
                  {item.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </ChartFrame>
  );
}

/** Horizontal bars built with HTML, used for "reservations by category". */
export function BarList({ title, data, valueLabel }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  const summary = data.map((item) => `${item.label}: ${item.value}`).join(', ');
  return (
    <ChartFrame title={title} summary={summary} columns={['Category', valueLabel]} rows={data.map((item) => [item.label, item.value])}>
      <ul className="bar-list">
        {data.map((item) => (
          <li key={item.label} className="bar-list__item">
            <span className="bar-list__label">{item.label}</span>
            <span className="bar-list__track" aria-hidden="true">
              <span className={`bar-list__fill bar-list__fill--${item.tone ?? 'primary'}`} style={{ '--bar-size': `${(item.value / max) * 100}%` }} />
            </span>
            <span className="bar-list__value">{item.value}</span>
          </li>
        ))}
      </ul>
    </ChartFrame>
  );
}

/** Donut chart, used for "requests by status". */
export function DonutChart({ title, data, centerLabel }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const summary = data.map((item) => `${item.label}: ${item.value}`).join(', ');
  let offset = 0;

  return (
    <ChartFrame title={title} summary={summary} columns={['Status', 'Requests']} rows={data.map((item) => [item.label, item.value])}>
      <div className="donut">
        <svg className="donut__chart" viewBox="0 0 160 160" role="img" aria-label={summary}>
          <circle className="donut__track" cx="80" cy="80" r={radius} />
          {data.map((item) => {
            const length = total === 0 ? 0 : (item.value / total) * circumference;
            const segment = (
              <circle
                key={item.label}
                className={`donut__segment donut__segment--${item.tone}`}
                cx="80"
                cy="80"
                r={radius}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 80 80)"
              >
                <title>{`${item.label}: ${item.value}`}</title>
              </circle>
            );
            offset += length;
            return segment;
          })}
          <text className="donut__total" x="80" y="80" textAnchor="middle">
            {total}
          </text>
          <text className="donut__caption" x="80" y="100" textAnchor="middle">
            {centerLabel}
          </text>
        </svg>
        <ul className="donut__legend">
          {data.map((item) => (
            <li key={item.label}>
              <span className={`legend__swatch donut__swatch--${item.tone}`} aria-hidden="true" />
              {item.label}
              <strong>{item.value}</strong>
            </li>
          ))}
        </ul>
      </div>
    </ChartFrame>
  );
}
