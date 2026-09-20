import Reveal from './Reveal.jsx';
import { projects } from '../data/site.js';

/**
 * Project grid.
 *
 * Real masonry via CSS multi-column (the .masonry rule in editorial.css) rather
 * than a row grid, so each project keeps its own aspect ratio and the columns
 * stagger naturally. Captions sit below each image, outside the frame.
 */
export default function ProjectGrid() {
  return (
    <ul className="masonry">
      {projects.map((project, index) => (
        <li key={project.slug}>
          <Reveal delay={(index % 3) * 90} className="tile group block">
            <div className={`tile-media w-full rounded-lg ${project.aspect}`}>
              <img
                src={project.image}
                alt={`${project.title}, ${project.program.toLowerCase()} project in ${project.location}`}
                loading={index < 3 ? 'eager' : 'lazy'}
                decoding="async"
                width="900"
                height="1125"
              />
            </div>

            <div className="mt-4 flex items-baseline justify-between gap-4">
              <div>
                <h3 className="text-lg tracking-tight">{project.title}</h3>
                <p className="mt-1 text-sm text-muted">{project.note}</p>
              </div>
              <p className="shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
                {project.year}
              </p>
            </div>

            <p className="mt-2 text-xs text-muted">
              {project.program}
              {' / '}
              {project.location}
            </p>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
