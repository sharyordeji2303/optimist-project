import { Link } from 'react-router-dom';
import { ArrowUpRight } from '@phosphor-icons/react';

export default function NotFound() {
  return (
    <main className="shell flex min-h-[100dvh] flex-col justify-center">
      <p className="label">404</p>
      <h1 className="mt-4 max-w-[20ch] text-[clamp(2rem,4.5vw,3.5rem)] font-medium leading-[1.04] tracking-[-0.03em]">
        That page is not here.
      </h1>
      <p className="body-measure mt-4 text-muted">
        The address may be wrong, or the page may have been moved since it was published.
      </p>
      <div className="mt-8">
        <Link to="/" className="btn btn-solid">
          Back to the studio
          <span className="btn-disc">
            <ArrowUpRight size={15} weight="light" />
          </span>
        </Link>
      </div>
    </main>
  );
}
