module.exports = {
    apps: [
        {
            name: 'back',
            script: 'server.js',
            env: {
                NODE_ENV: 'prod',
            },
            env_prod: {
                NODE_ENV: 'prod',
            },
            env_dev: {
                NODE_ENV: 'dev',
            },
        }
    ]
};
