
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');
const BASE_URL = 'https://blog.asmari.me';
const WP_API_BASE = 'https://cms.asmari.me/wp-json/wp/v2/posts';

const cleanHTML = (html) => html.replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><').trim();

async function fetchAllPosts() {
  let allPosts = [];
  let page = 1;
  let totalPages = 1;

  console.log('📡 جلب المقالات من ووردبريس...');
  
  try {
    do {
      const res = await fetch(`${WP_API_BASE}?per_page=100&page=${page}&_embed=1`);
      if (!res.ok) break;
      const posts = await res.json();
      totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1');
      allPosts = [...allPosts, ...posts];
      console.log(`✅ تم جلب الصفحة ${page} من ${totalPages}`);
      page++;
    } while (page <= totalPages);
  } catch (e) {
    console.error('❌ خطأ في الجلب:', e);
  }
  return allPosts;
}

function generatePostHTML(post) {
  const title = post.title.rendered;
  const date = new Date(post.date).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' });
  const content = post.content.rendered;
  const imageUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
  
  return `
    <div class="max-w-md mx-auto px-6 pt-24 pb-10">
      <article>
        <header class="mb-8">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-[10px] font-bold text-slate-600 uppercase tracking-widest">${date}</span>
          </div>
          <h1 class="text-3xl font-extrabold text-white leading-[1.4] mb-4">${title}</h1>
          <div class="w-12 h-1 bg-[#1B19A8] rounded-full"></div>
        </header>
        ${imageUrl ? `<img src="${imageUrl}" class="w-full aspect-video object-cover rounded-2xl mb-8 shadow-2xl" alt="${title}">` : ''}
        <div class="wp-content text-slate-200 text-[17px] leading-[1.8] space-y-6">
          ${content}
        </div>
      </article>
    </div>
  `;
}

function generateHomeHTML(posts) {
  const listItems = posts.map(post => `
    <article class="mb-12">
      <div class="relative aspect-video rounded-2xl overflow-hidden mb-5 bg-white/5">
        <img src="${post._embedded?.['wp:featuredmedia']?.[0]?.source_url || ''}" class="w-full h-full object-cover" alt="${post.title.rendered}">
      </div>
      <h2 class="text-xl font-bold text-white mb-2 leading-[1.4]">${post.title.rendered}</h2>
      <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">${post.excerpt.rendered.replace(/<[^>]*>?/gm, '')}</p>
      <a href="/post/${post.slug}" class="text-[#FFA042] text-[10px] font-black uppercase tracking-widest">اقرأ التدوينة ←</a>
    </article>
  `).join('');

  return `
    <main class="max-w-md mx-auto px-6 pt-32">
      <section class="mb-10">
        <h1 class="text-xl font-bold text-white mb-2">نوّرت المسودّة ..</h1>
        <p class="text-sm text-slate-500 leading-relaxed font-medium">هذي مساحة شخصية اكتب فيها أنا سلمان الأسمري عن الإعلانات .. الأفلام .. وتأملات ومنوعات تطرأ على البال</p>
      </section>
      <section class="space-y-12">${listItems}</section>
    </main>
  `;
}

async function runPrerender() {
  const posts = await fetchAllPosts();
  if (!posts.length) return;

  const templatePath = path.join(DIST_DIR, 'index.html');
  const template = fs.readFileSync(templatePath, 'utf-8');

  let sitemapEntries = [`  <url><loc>${BASE_URL}/</loc><priority>1.0</priority></url>`];

  // 1. توليد الصفحة الرئيسية
  const homeContent = generateHomeHTML(posts.slice(0, 20)); // أول 20 مقال للرئيسية
  let homeHtml = template.replace('<div id="root"></div>', `<div id="root">${homeContent}</div>`);
  fs.writeFileSync(templatePath, cleanHTML(homeHtml));
  console.log('✅ تم توليد الصفحة الرئيسية (Static List)');

  // 2. توليد صفحات المقالات
  for (const post of posts) {
    const slug = post.slug;
    const postUrl = `${BASE_URL}/post/${slug}`;
    const title = post.title.rendered.replace(/<[^>]*>?/gm, '');
    const excerpt = post.excerpt.rendered.replace(/<[^>]*>?/gm, '').substring(0, 160).trim();
    const imageUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';

    const seoTags = `
      <title>${title} | مسودّة سلمان الأسمري</title>
      <meta name="description" content="${excerpt}">
      <link rel="canonical" href="${postUrl}">
      <meta property="og:title" content="${title}">
      <meta property="og:description" content="${excerpt}">
      <meta property="og:image" content="${imageUrl}">
      <meta property="og:url" content="${postUrl}">
      <meta property="og:type" content="article">
      <meta name="twitter:card" content="summary_large_image">
    `;

    const postBody = generatePostHTML(post);
    let html = template
      .replace(/<title>.*?<\/title>/, seoTags)
      .replace('<div id="root"></div>', `<div id="root">${postBody}</div>`)
      .replace('<html lang="ar" dir="rtl">', `<html lang="ar" dir="rtl" prefix="og: https://ogp.me/ns#">`);

    const postDir = path.join(DIST_DIR, 'post', slug);
    if (!fs.existsSync(postDir)) fs.mkdirSync(postDir, { recursive: true });
    fs.writeFileSync(path.join(postDir, 'index.html'), cleanHTML(html));

    sitemapEntries.push(`  <url><loc>${postUrl}</loc><lastmod>${post.modified.split('T')[0]}</lastmod><priority>0.8</priority></url>`);
    console.log(`📄 تم توليد المقال: ${slug}`);
  }

  // 3. Sitemap & Robots
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapEntries.join('\n')}</urlset>`);
  fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${BASE_URL}/sitemap.xml`);
  
  console.log('✨ انتهت عملية الـ Prerender الحقيقية بنجاح.');
}

runPrerender();
