// C:\Users\Administrator\Documents\client_2\ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'ppc-web2',                              // ª×èÍâ»Ãà«ÊË¹éÒºéÒ¹
      cwd: __dirname,                                // ·Ó§Ò¹ã¹ client_2
      script: './node_modules/serve/build/main.js',  // ãªé serve (áºº local)
      args: ['-s', 'dist', '--single', '-l', 'tcp://0.0.0.0:3000'], // ¾ÍÃìµ 3000
      interpreter: 'node',
      env: { NODE_ENV: 'production' }
    }
  ]
};
