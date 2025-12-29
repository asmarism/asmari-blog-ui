import { Post, Category } from './types';

// الرابط الأساسي لـ API ووردبريس
const SITE_URL = 'https://blog.asmari.me';

export async function fetchWordPressPosts(): Promise<Post[]> {
  // سنحاول الرابطين (الرابط الجميل والرابط التقليدي)
  const urls = [
    `${SITE_URL}/wp-json/wp/v2/posts?_embed&per_page=12`,
    `${SITE_URL}/?rest_route=/wp/v2/posts&_embed&per_page=12`
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return processWPData(data);
      }
    } catch (e) {
      console.error(`فشل المحاولة مع الرابط: ${url}`, e);
    }
  }
  
  // إذا فشل كل شيء، نرجع مصفوفة فارغة وسيتعامل التطبيق معها بعرض بيانات تجريبية
  return [];
}

function processWPData(data: any[]): Post[] {
  return data.map((post: any) => {
    const wpTerms = post._embedded?.['wp:term']?.[0] || [];
    const categoryNames = wpTerms.map((term: any) => term.name);

    return {
      id: post.id.toString(),
      title: post.title.rendered,
      excerpt: post.excerpt.rendered.replace(/<[^>]*>?/gm, '').substring(0, 110) + '...',
      category: mapToMyCategories(categoryNames),
      date: new Date(post.date).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' }),
      imageUrl: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || 
                'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=800&auto=format&fit=crop'
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