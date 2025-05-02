/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // LibSQLとの互換性を持たせるため、バンドリングから除外
  serverExternalPackages: ['@libsql/client', '@libsql/core', '@libsql/hrana-client'],
  // Add custom Webpack configuration to handle Markdown files
  webpack: (config) => {
    // Treat .md files as raw text to avoid Webpack parse errors from libraries bundling README.md
    config.module.rules.push({
      test: /\.md$/i,
      use: 'raw-loader',
    });
    // Ignore native .node binaries that libraries like @libsql bundle
    config.module.rules.push({
      test: /\.node$/i,
      use: 'ignore-loader',
    });
    // Ignore TypeScript declaration files that some libraries mistakenly export
    config.module.rules.push({ test: /\.d\.ts$/i, use: 'ignore-loader' });

    // Prevent bundling of server-only libsql packages on the client
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@libsql/client': false,
      '@libsql/core': false,
      '@libsql/hrana-client': false,
    };

    return config;
  },
};

export default nextConfig;
