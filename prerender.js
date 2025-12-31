
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');
const BASE_URL = 'https://blog.asmari.me';
const API_URL = 'https://cms.asmari.me/wp-json/wp/v2/posts?_embed&per_page=100';

// وظيفة لتنظيف الـ HTML من التعليقات والمسافات الزائدة
const cleanHTML = (html) => {
  return html
    .replace(/<!--[\s\S]*?-->/g, '') // حذف التعليقات
    .replace(/>\s+</g, '><')         // تقليل المسافات بين الوسوم
    .trim();
};

async function prerender() {
  console.log('🚀 بدء التنظيف والـ Prerendering للـ SEO...');

  try {
    const response = await fetch(API_URL);
    const posts = await response.json();

    if (!Array.isArray(posts)) return;

    const templatePath = path.join(DIST_DIR, 'index.html');
    if (!fs.existsSync(templatePath)) return;
    
    // القالب الأصلي الذي أنتجه Vite (يحتوي على روابط الـ JS المضغوطة)
    const template = fs.readFileSync(templatePath, 'utf-8');

    let sitemapEntries = [`  <url><loc>${BASE_URL}/</loc><priority>1.0</priority></url>`];

    for (const post of posts) {
      const slug = post.slug;
      const title = post.title.rendered.replace(/&#[0-9]+;/g, '').replace(/<[^>]*>?/gm, '');
      const excerpt = post.excerpt.rendered.replace(/<[^>]*>?/gm, '').substring(0, 160).trim();
      const imageUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || 'https://asmari.me/wp-content/uploads/2023/12/cropped-Fav-192x192.png';
      const postUrl = `${BASE_URL}/post/${slug}`;

      // وسوم SEO نظيفة ومضغوطة
      const seoTags = `<title>${title} | مسودّة سلمان الأسمري</title><meta name="description" content="${excerpt}"><link rel="canonical" href="${postUrl}"><meta property="og:title" content="${title}"><meta property="og:description" content="${excerpt}"><meta property="og:image" content="${imageUrl}"><meta property="og:url" content="${postUrl}"><meta property="og:type" content="article"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${excerpt}"><meta name="twitter:image" content="${imageUrl}">`;

      // حقن البيانات مع تنظيف الوسوم القديمة
      let html = template
        .replace(/<title>.*?<\/title>/, seoTags)
        .replace('<html lang="ar" dir="rtl">', `<html lang="ar" dir="rtl" prefix="og: https://ogp.me/ns#">`);

      // تنظيف نهائي للمصدر
      html = cleanHTML(html);

      const postDir = path.join(DIST_DIR, 'post', slug);
      if (!fs.existsSync(postDir)) fs.mkdirSync(postDir, { recursive: true });
      fs.writeFileSync(path.join(postDir, 'index.html'), html);

      sitemapEntries.push(`  <url><loc>${postUrl}</loc><lastmod>${post.modified.split('T')[0]}</lastmod><priority>0.8</priority></url>`);
      console.log(`✅ ${slug} [تم التنظيف والحفظ]`);
    }

    // توليد الملفات التقنية بصمت
    fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapEntries.join('\n')}</urlset>`);
    fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${BASE_URL}/sitemap.xml`);

    console.log('✨ انتهى التنظيف. المصدر الآن احترافي بالكامل.');

  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

prerender();
