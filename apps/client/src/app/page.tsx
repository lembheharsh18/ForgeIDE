export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center space-y-6 animate-fade-in">
        <h1 className="text-6xl font-bold tracking-tight">
          <span className="gradient-text">FORGE</span>{' '}
          <span className="text-text-secondary">IDE</span>
        </h1>
        <p className="text-text-secondary text-lg font-mono">
          PICT Coders League — Competitive Programming Platform
        </p>
        <div className="flex gap-3 justify-center">
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-bg-elevated border border-border-subtle text-forge-green">
            ● System Online
          </span>
        </div>
      </div>
    </main>
  );
}
