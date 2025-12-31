
import { Post, Category } from './types';

const SITE_URL = 'https://cms.asmari.me';

const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

function formatDateSafely(dateInput: string): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return dateInput;

  const day = String(date.getDate()).padStart(2, '0');
  const month = ARABIC_MONTHS[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}م`;
}

export async function fetchWordPressPosts(page = 1, perPage = 20): Promise<{posts: Post[], totalPages: number}> {
  const url = `${SITE_URL}/wp-json/wp/v2/posts?_embed&per_page=${perPage}&page=${page}`;
  
  try {
    const response = await fetch(url);
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');
    if (response.ok) {
      const data = await response.json();
      return { posts: processWPData(data), totalPages };
    }
  } catch (e) {
    console.error(`فشل جلب المقالات: ${url}`, e);
  }
  
  return { posts: [], totalPages: 0 };
}

// وظيفة لجلب كل المقالات (تستخدم في وقت البناء فقط)
export async function fetchAllPosts(): Promise<Post[]> {
  let allPosts: Post[] = [];
  let currentPage = 1;
  let totalPages = 1;

  try {
    do {
      const result = await fetchWordPressPosts(currentPage, 100);
      allPosts = [...allPosts, ...result.posts];
      totalPages = result.totalPages;
      currentPage++;
    } while (currentPage <= totalPages);
  } catch (e) {
    console.error("خطأ في جلب كافة المقالات", e);
  }

  return allPosts;
}

function processWPData(data: any[]): Post[] {
  return data.map((post: any) => {
    const wpTerms = post._embedded?.['wp:term']?.[0] || [];
    const categoryNames = wpTerms.map((term: any) => term.name);
    
    // استبدال روابط المحتوى لتشير إلى الـ CMS مباشرة
    const cleanContent = post.content.rendered.replace(/https:\/\/blog\.asmari\.me\/wp-content\//g, 'https://cms.asmari.me/wp-content/');
    
    // معالجة الصورة البارزة أو الافتراضية
    let imageUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || 
                   'https://cms.asmari.me/wp-content/uploads/2023/12/cropped-Fav-192x192.png';
    imageUrl = imageUrl.replace(/https:\/\/blog\.asmari\.me\/wp-content\//g, 'https://cms.asmari.me/wp-content/');

    return {
      id: post.id.toString(),
      slug: post.slug,
      title: post.title.rendered,
      excerpt: post.excerpt.rendered.replace(/<[^>]*>?/gm, '').substring(0, 160).trim(),
      content: cleanContent,
      category: mapToMyCategories(categoryNames),
      date: formatDateSafely(post.date),
      imageUrl: imageUrl,
      link: post.link
    };
  });
}

function mapToMyCategories(wpCategoryNames: string[]): Category {
  const myCategories: Category[] = ['إعلانات', 'أفلام', 'تأملات', 'منوعات'];
  const matched = myCategories.find(myCat => 
    wpCategoryNames.some(wpCat => wpCat.trim() === myCat)
  );
  return matched || 'منوعات';
}
