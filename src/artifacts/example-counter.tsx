"use client";

import { useState } from "react";

export default function ExampleCounter() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
      <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
        Counter: {count}
      </h1>
      <div className="flex gap-3">
        <button
          onClick={() => setCount((c) => c - 1)}
          className="px-6 py-3 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
        >
          -
        </button>
        <button
          onClick={() => setCount((c) => c + 1)}
          className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
        >
          +
        </button>
      </div>
      <p className="text-zinc-500 text-sm">
        This is an example artifact. Replace it with your own!
      </p>
    </div>
  );
}
