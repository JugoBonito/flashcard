import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Fallbacks for Node.js modules in the browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        buffer: false,
        stream: false,
      };

      // Handle sql.js WASM file
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      };

      // Add rule for WASM files
      config.module.rules.push({
        test: /\.wasm$/,
        type: 'webassembly/async',
      });

      // Ignore sql.js node-specific modules
      config.resolve.alias = {
        ...config.resolve.alias,
        'sql.js': 'sql.js/dist/sql-wasm.js',
      };
    }
    
    return config;
  },
  // Handle static files for sql.js
  async headers() {
    return [
      {
        source: '/sql-wasm.wasm',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/wasm',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
