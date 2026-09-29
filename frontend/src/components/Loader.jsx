export default function Loader() {
  return (
    <div className="shell flex min-h-[100dvh] flex-col justify-center gap-4 pt-24" aria-busy="true">
      <div className="skeleton h-4 w-40" />
      <div className="skeleton h-10 w-72" />
      <div className="skeleton h-24 w-full max-w-xl" />
      <span className="sr-only">Checking your session</span>
    </div>
  );
}
