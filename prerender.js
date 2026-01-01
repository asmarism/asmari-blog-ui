
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

  console.log('🚀 بدء جلب كافة المقالات لعملية الـ Prerendering...');
  
  try {
    do {
      const res = await fetch(`${WP_API_BASE}?per_page=100&page=${page}&_embed=1`);
      if (!res.ok) break;
      const posts = await res.json();
      totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1');
      allPosts = [...allPosts, ...posts];
      console.log(`✅ جاري معالجة الصفحة ${page} من ${totalPages}`);
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
  const content = post.content.rendered.replace(/https:\/\/blog\.asmari\.me\/wp-content\//g, 'https://cms.asmari.me/wp-content/');
  
  let imageUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
  if (imageUrl) {
    imageUrl = imageUrl.replace(/https:\/\/blog\.asmari\.me\/wp-content\//g, 'https://cms.asmari.me/wp-content/');
  }
  
  return `
    <div class="max-w-4xl mx-auto px-6 pt-24 pb-10">
      <article>
        <header class="mb-12">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-[10px] font-bold text-slate-600 uppercase tracking-widest">${date}</span>
          </div>
          <h1 class="text-3xl md:text-5xl font-extrabold text-white leading-[1.3] mb-4">${title}</h1>
          <div class="w-16 h-1 bg-[#1B19A8] rounded-full"></div>
        </header>
        ${imageUrl ? `<img src="${imageUrl}" class="w-full aspect-video object-cover rounded-3xl mb-12 shadow-2xl" alt="${title} - سلمان الأسمري">` : ''}
        <div class="wp-content text-slate-200 text-[18px] md:text-[20px] leading-[1.8] space-y-6">
          ${content}
        </div>
        <div class="seo-hidden" style="display:none">
          بقلم: سلمان محمد حومان الأسمري | الكاتب: سلمان الأسمري | المؤلف: سلمان محمد الأسمري
        </div>
      </article>
    </div>
  `;
}

async function runPrerender() {
  const posts = await fetchAllPosts();
  if (!posts.length) return;

  const templatePath = path.join(DIST_DIR, 'index.html');
  const template = fs.readFileSync(templatePath, 'utf-8');

  for (const post of posts) {
    const slug = post.slug;
    const postUrl = `${BASE_URL}/post/${slug}`;
    const title = post.title.rendered.replace(/<[^>]*>?/gm, '');
    const excerpt = post.excerpt.rendered.replace(/<[^>]*>?/gm, '').substring(0, 160).trim();
    let imageUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
    imageUrl = imageUrl.replace(/https:\/\/blog\.asmari\.me\/wp-content\//g, 'https://cms.asmari.me/wp-content/');

    const seoTags = `
      <title>${title} | سلمان الأسمري</title>
      <meta name="description" content="${excerpt}">
      <meta name="author" content="سلمان محمد حومان الأسمري">
      <link rel="canonical" href="${postUrl}">
      <meta property="og:title" content="${title} - سلمان الأسمري">
      <meta property="og:description" content="${excerpt}">
      <meta property="og:image" content="${imageUrl}">
      <meta property="og:url" content="${postUrl}">
      <meta property="article:author" content="سلمان محمد حومان الأسمري">
      <meta property="og:type" content="article">
    `;

    const postBody = generatePostHTML(post);
    let html = template
      .replace(/<title>.*?<\/title>/, seoTags)
      .replace('<div id="root"></div>', `<div id="root">${postBody}</div>`);

    const postDir = path.join(DIST_DIR, 'post', slug);
    if (!fs.existsSync(postDir)) fs.mkdirSync(postDir, { recursive: true });
    fs.writeFileSync(path.join(postDir, 'index.html'), cleanHTML(html));
  }

  console.log(`✨ اكتمل توليد ${posts.length} صفحة متجاوبة بنجاح.`);
}

runPrerender();
