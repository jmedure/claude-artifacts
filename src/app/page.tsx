import fs from "fs";
import path from "path";
import Link from "next/link";

function getArtifacts() {
  const dir = path.join(process.cwd(), "src/artifacts");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(jsx|tsx)$/.test(f))
    .map((f) => {
      const slug = f.replace(/\.(jsx|tsx)$/, "");
      const stat = fs.statSync(path.join(dir, f));
      return { slug, filename: f, modified: stat.mtime.toISOString() };
    })
    .sort((a, b) => b.modified.localeCompare(a.modified));
}

export default function Home() {
  const artifacts = getArtifacts();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-zinc-100">
          Claude Artifacts
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">
          Drop <code className="bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm">.tsx</code> files
          into <code className="bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm">src/artifacts/</code> and
          they&apos;ll show up here.
        </p>

        {artifacts.length === 0 ? (
          <div className="text-zinc-400 dark:text-zinc-600 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-12 text-center">
            No artifacts yet. Add a .tsx file to src/artifacts/ to get started.
          </div>
        ) : (
          <ul className="space-y-2">
            {artifacts.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/a/${a.slug}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {a.slug}
                  </span>
                  <span className="text-sm text-zinc-400">
                    {a.filename}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
