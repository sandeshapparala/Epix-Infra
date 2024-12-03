/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://epixinfra.com', // Replace with your site's URL
    generateRobotsTxt: true, // Generates robots.txt file
    outDir: './public', // Output directory for the sitemap
    exclude: ['/admin/*', '/dashboard/*'], // Paths to exclude from the sitemap
    robotsTxtOptions: {
        additionalSitemaps: [
            'https://epixinfra.com/sitemap-1.xml',
            'https://epixinfra.com/sitemap-2.xml',
        ],
    },
};
