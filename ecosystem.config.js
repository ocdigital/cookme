module.exports = {
  apps: [
    {
      name: 'cookme-backend',
      cwd: './backend',
      script: 'npm',
      args: 'run start:dev',
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      out_file: '../.backend.log',
      error_file: '../.backend.log',
      merge_logs: true,
      time: true,
    },
    {
      name: 'cookme-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run dev -- --port 4000',
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV: 'development',
      },
      out_file: '../.frontend.log',
      error_file: '../.frontend.log',
      merge_logs: true,
      time: true,
    },
  ],
};
