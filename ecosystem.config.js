module.exports = {
  apps: [
    {
      name: 'cpm-market',
      script: 'backend/src/server.js',
      node_args: '--use-system-ca',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
