
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');
const BASE_URL = 'https://blog.asmari.me';
const WP_API_BASE = 'https://cms.asmari.me/wp-json/wp/v2/posts';

// دقيقة لتنظيف الـ HTML ليكون خفيفاً وسريع الأرشفة
const cleanHTML = (html) => html.replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><').trim();

async function fetchAllPosts() {
  let allPosts = [];
  let page = 1;
  let totalPages = 1;

  console.log('🚀 بدء جلب كافة المقالات من المسودة...');
  
  try {
    do {
      // نطلب 100 مقال في كل مرة لسرعة التنفيذ
      const res = await fetch(`${WP_API_BASE}?per_page=100&page=${page}&_embed=1`);
      if (!res.ok) break;
      const posts = await res.json();
      totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1');
      allPosts = [...allPosts, ...posts];
      console.log(`✅ تم أرشفة الصفحة ${page} من ${totalPages} (إجمالي المقالات الآن: ${allPosts.length})`);
      page++;
    } while (page <= totalPages);
  } catch (e) {
    console.error('❌ خطأ في الاتصال بووردبريس:', e);
  }
  return allPosts;
}

function generatePostHTML(post) {
  const title = post.title.rendered;
  const date = new Date(post.date).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' });
  
  // استبدال الروابط لضمان عمل الصور من الـ CMS
  const content = post.content.rendered.replace(/https:\/\/blog\.asmari\.me\/wp-content\//g, 'https://cms.asmari.me/wp-content/');
  
  let imageUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
  if (imageUrl) {
    imageUrl = imageUrl.replace(/https:\/\/blog\.asmari\.me\/wp-content\//g, 'https://cms.asmari.me/wp-content/');
  }
  
  // هذا الجزء هو ما سيظهر في "View Page Source"
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
        ${imageUrl ? `<img src="${imageUrl}" class="w-full aspect-video object-cover rounded-2xl mb-8 shadow-2xl" alt="${title} - سلمان الأسمري">` : ''}
        
        <!-- نص المقال الكامل الذي يقرأه جوجل ويظهر في الكود المصدري -->
        <div class="wp-content text-slate-200 text-[17px] leading-[1.8] space-y-6">
          ${content}
        </div>

        <!-- تأكيد الهوية في نهاية الكود المصدري لكل مقال -->
        <div class="seo-hidden" style="display:none">
          بقلم: سلمان محمد حومان الأسمري
          نشر بواسطة: سلمان محمد الأسمري
          المؤلف: سلمان الأسمري
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

  // توليد صفحات المقالات (كل مقال له ملف HTML مستقل)
  for (const post of posts) {
    const slug = post.slug;
    const postUrl = `${BASE_URL}/post/${slug}`;
    const title = post.title.rendered.replace(/<[^>]*>?/gm, '');
    const excerpt = post.excerpt.rendered.replace(/<[^>]*>?/gm, '').substring(0, 160).trim();
    let imageUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
    imageUrl = imageUrl.replace(/https:\/\/blog\.asmari\.me\/wp-content\//g, 'https://cms.asmari.me/wp-content/');

    // تحديث الميتا تاج لكل صفحة باسمك الثلاثي
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
  }

  console.log(`✨ تم بنجاح توليد ${posts.length} صفحة ثابتة تحتوي على النص الكامل والأسماء الثلاثية.`);
}

runPrerender();
