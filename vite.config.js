import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        proxy: {
            '/api/hotpepper': {
                target: 'http://webservice.recruit.co.jp',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/hotpepper/, '/hotpepper'),
            },
            '/api/google-places': {
                target: 'https://maps.googleapis.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/google-places/, '/maps/api/place'),
            },
        },
    },
});
