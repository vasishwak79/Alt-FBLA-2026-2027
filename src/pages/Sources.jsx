import { PageHeader } from '../components/Feedback.jsx';
import { Icon } from '../components/Icon.jsx';
import { useDocumentTitle } from '../hooks/useCommon.js';
import { SOURCES } from './sourcesData.js';

const TECHNOLOGIES = [
  ['React 19', 'User interface library', 'MIT License', 'https://react.dev/'],
  ['React Router 7', 'Page routing in the browser', 'MIT License', 'https://reactrouter.com/'],
  ['Vite 7', 'Development server and build tool', 'MIT License', 'https://vite.dev/'],
  ['Node.js 24', 'Server runtime, including the built-in http, crypto, and sqlite modules', 'MIT License', 'https://nodejs.org/'],
  ['SQLite', 'Database engine (bundled with Node.js)', 'Public domain', 'https://sqlite.org/'],
  ['Atkinson Hyperlegible', 'Body font, by the Braille Institute', 'SIL Open Font License 1.1', 'https://www.brailleinstitute.org/freefont/'],
  ['Plus Jakarta Sans', 'Heading font, by Tokotype', 'SIL Open Font License 1.1', 'https://fonts.google.com/specimen/Plus+Jakarta+Sans'],
];

export default function Sources() {
  useDocumentTitle('Sources & credits');

  return (
    <>
      <PageHeader
        eyebrow="Documentation"
        title="Sources & credits"
        description="The research, standards, and tools behind Commons, and how each one was used."
      />

      <div className="container prose-page">
        <section className="section--tight" aria-labelledby="cited-heading">
          <h2 id="cited-heading">Works cited</h2>
          <p className="muted">Citations follow APA 7th edition style.</p>
          <ol className="citations">
            {SOURCES.map((source) => (
              <li key={source.id} id={source.id} className="citation-entry" tabIndex={-1}>
                <p className="citation-entry__reference">
                  {source.author} {source.year} <cite>{source.title}</cite>. {source.publisher}{' '}
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.url}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </p>
                <p className="citation-entry__use">
                  <Icon name="info" size={16} />
                  <span>
                    <strong>How we used it:</strong> {source.usedFor}
                  </span>
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="section--tight" aria-labelledby="tech-credits-heading">
          <h2 id="tech-credits-heading">Technologies &amp; licenses</h2>
          <p>
            These open-source tools are used under their licenses. Everything else, including every page, component,
            stylesheet, server route, and test, was written by our team.
          </p>
          <div className="table-wrap">
            <table className="data-table data-table--responsive">
              <caption className="sr-only">Technologies and their licenses</caption>
              <thead>
                <tr>
                  <th scope="col">Technology</th>
                  <th scope="col">Used for</th>
                  <th scope="col">License</th>
                </tr>
              </thead>
              <tbody>
                {TECHNOLOGIES.map(([name, use, license, url]) => (
                  <tr key={name}>
                    <th scope="row" data-label="Technology">
                      <a href={url} target="_blank" rel="noreferrer">
                        {name}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    </th>
                    <td data-label="Used for">{use}</td>
                    <td data-label="License">{license}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="section--tight" aria-labelledby="original-heading">
          <h2 id="original-heading">Original work &amp; copyright</h2>
          <ul className="feature-list">
            <li>
              <Icon name="sparkle" size={20} className="feature-list__icon" />
              <div>
                <h3>Graphics</h3>
                <p>
                  The logo, icons, category illustrations, home page illustration, and charts were drawn in code (SVG) by our
                  team for this project. No stock photos, clip art, or icon packs were used.
                </p>
              </div>
            </li>
            <li>
              <Icon name="layers" size={20} className="feature-list__icon" />
              <div>
                <h3>No templates</h3>
                <p>
                  The layout, design system, and every component were built from scratch. No website templates, themes, or
                  UI component kits (such as Bootstrap) were used.
                </p>
              </div>
            </li>
            <li>
              <Icon name="tag" size={20} className="feature-list__icon" />
              <div>
                <h3>Trademarks</h3>
                <p>
                  Resources use generic names (for example, “Student Laptops”) rather than brand names, and no company
                  logos appear on the site.
                </p>
              </div>
            </li>
            <li>
              <Icon name="info" size={20} className="feature-list__icon" />
              <div>
                <h3>Demonstration data</h3>
                <p>
                  Lakeside High School, its staff and students, and every reservation and request are fictional. Email
                  addresses use the reserved “.example” domain so they cannot belong to a real person.
                </p>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
