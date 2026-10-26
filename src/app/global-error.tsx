"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-white flex flex-col items-center justify-center min-h-screen p-6">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-950 border border-red-800 text-red-400 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            !
          </div>
          <h2 className="text-xl font-bold mb-2">Application Error</h2>
          <p className="text-neutral-400 text-sm mb-6">
            {error?.message || "An unexpected error occurred while loading Unfiltered Lore Studio."}
          </p>
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg"
          >
            Retry Application
          </button>
        </div>
      </body>
    </html>
  );
}
