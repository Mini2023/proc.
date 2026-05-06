/** @type {import('next').NextConfig} */
const nextConfig = {
    logging: {
        fetches: {
            fullUrl: true,
        },
    },
    experimental: {
        // Erlaube deinem Handy den Zugriff auf den Dev-Server
        allowedDevOrigins: ['192.168.178.75', 'localhost:3000'],
    },
    // ... deine restliche PWA Konfiguration
};

export default nextConfig;