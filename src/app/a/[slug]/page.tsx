import fs from "fs";
import path from "path";
import Link from "next/link";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

export const dynamicParams = true;

const artifactsDir = path.join(process.cwd(), "src/artifacts");

export function generateStaticParams() {
  if (!fs.existsSync(artifactsDir)) return [];
  return fs
    .readdirSync(artifactsDir)
    .filter((f) => /\.(jsx|tsx)$/.test(f))
    .map((f) => ({ slug: f.replace(/\.(jsx|tsx)$/, "") }));
}

export default async function ArtifactPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Check if file exists
  const tsxPath = path.join(artifactsDir, `${slug}.tsx`);
  const jsxPath = path.join(artifactsDir, `${slug}.jsx`);
  if (!fs.existsSync(tsxPath) && !fs.existsSync(jsxPath)) {
    notFound();
  }

  const Artifact = dynamic(() => import(`@/artifacts/${slug}`), {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen text-zinc-400">
        Loading...
      </div>
    ),
  });

  return (
    <div className="min-h-screen">
      <nav className="fixed top-4 left-4 z-50">
        <Link
          href="/"
          className="bg-zinc-900/80 dark:bg-zinc-100/80 text-white dark:text-black text-sm px-3 py-1.5 rounded-full backdrop-blur hover:opacity-80 transition-opacity"
        >
          &larr; All Artifacts
        </Link>
      </nav>
      <Artifact />
    </div>
  );
}
