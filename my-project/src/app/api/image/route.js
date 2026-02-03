// my-project/app/api/image/route.js
import { NextResponse } from 'next/server';

// 定义允许访问图片的域名白名单（必须包含协议头 http:// 或 https://）
const ALLOWED_DOMAINS = [
  'https://3dgallery-82o516xqw-cucus-projects-0de0210f.vercel.app', // 请替换为你的Vercel域名
  'http://localhost:3000',                 // 本地开发环境
  // 未来可以在这里添加你的自定义域名
];

export async function GET(request) {
  // 1. 获取请求的来源信息，用于防盗链验证
  const referer = request.headers.get('referer');
  const origin = request.headers.get('origin');
  const requestOrigin = origin || referer; // 优先使用 Origin，没有则用 Referer

  // 2. 进行严格的防盗链验证
  const isAllowed = ALLOWED_DOMAINS.some(domain => requestOrigin?.startsWith(domain));
  
  if (!isAllowed) {
    // 请求来源不在白名单内，返回403禁止访问
    // 你可以返回一个JSON错误，也可以返回一张“禁止访问”的提示图片
    return new NextResponse(
      JSON.stringify({ error: 'Forbidden: Hotlinking not allowed.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 3. 获取查询参数中的图片ID
  // 前端调用示例：/api/image?id=image-abc123-500x500.jpg
  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get('id');
  const width = searchParams.get('width');

  if (!imageId) {
    return new NextResponse(
      JSON.stringify({ error: 'Image ID is required.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 4. 构建真实的Sanity图片URL
  // 你需要确保环境变量 NEXT_PUBLIC_SANITY_PROJECT_ID 和 NEXT_PUBLIC_SANITY_DATASET 已正确设置
  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
  // 解码ID，并构建基础URL
  const decodedId = decodeURIComponent(imageId);
  let sanityImageUrl = `https://cdn.sanity.io/images/${projectId}/${dataset}/${decodedId}`;
  
  const params = new URLSearchParams();
  if (width) params.set('w', width); // 将 width 转换为 Sanity 的参数 'w'
  
  const paramString = params.toString();
  if (paramString) {
    sanityImageUrl += `?${paramString}`;
  }

  try {
    // 5. 代理请求：向Sanity CDN获取图片
    const imageResponse = await fetch(sanityImageUrl);
    console.log('Fetching from Sanity URL:', sanityImageUrl); 
    console.log('Sanity Response Status:', imageResponse.status); 

    if (!imageResponse.ok) {
      // 如果Sanity返回错误（例如图片不存在），将错误传递给前端
      throw new Error(`Failed to fetch image from Sanity: ${imageResponse.status}`);
    }

    // 6. 获取Sanity返回的图片数据和响应头
    const imageData = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // 7. 将图片响应返回给前端浏览器
    return new NextResponse(imageData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // 设置缓存头，提升性能（例如缓存1天）
        'Cache-Control': 'public, max-age=86400',
        // 可选：允许前端站点跨域访问此API（如果域名不同）
        'Access-Control-Allow-Origin': ALLOWED_DOMAINS[0],
      },
    });

  } catch (error) {
    console.error('Image proxy error:', error);
    console.error('Debug Info - Sanity URL that failed:', sanityImageUrl);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}