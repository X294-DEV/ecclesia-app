import type { NextConfig } from "next";

// Nota: se desactivaron `cacheComponents` y `partialPrefetching` (venían activados
// por create-next-app) para usar el modelo normal de Next.js: las páginas que leen
// la sesión o la base de datos son dinámicas y no hay que envolver todo en <Suspense>.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
