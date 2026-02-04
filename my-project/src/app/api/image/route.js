// my-project/src/app/api/image/route.js
import { NextResponse } from 'next/server';

// 定义允许访问图片的域名白名单（必须包含协议头 http:// 或 https://）
const ALLOWED_DOMAINS = [
  'https://*.vercel.app',
  'http://localhost:3000',
  // 未来可以在这里添加你的自定义域名，例如：
  // 'https://www.yourdomain.com',
];

export async function GET(request) {
  // --- 1. 初始化调试信息收集器 ---
  const debugInfo = [];
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const isDebugMode = searchParams.get('debug') === 'true';

  // --- 2. 获取并记录请求来源 ---
  const referer = request.headers.get('referer');
  const origin = request.headers.get('origin');
  const requestOrigin = origin || referer; // 优先使用 Origin，没有则用 Referer
  debugInfo.push(`[1] 请求来源 (requestOrigin): ${requestOrigin}`);

  // --- 3. 执行防盗链验证（支持通配符 *）---
  debugInfo.push(`[2] 白名单 (ALLOWED_DOMAINS): ${JSON.stringify(ALLOWED_DOMAINS)}`);
  
  let isAllowed = false;
  const requestHost = request.headers.get('host'); // 新增：获取请求的目标主机名

  // 新增一个辅助函数：规范化URL，移除末尾的斜杠以便比较
const normalizeUrlForComparison = (url) => {
  if (!url) return url;
  // 移除 URL 末尾的斜杠，但保留协议头（如 http://）
  return url.replace(/\/$/,'');
};

  if (requestOrigin) {
  const normalizedRequestOrigin = normalizeUrlForComparison(requestOrigin);
  debugInfo.push(`[2.1] 规范化后的请求来源: ${normalizedRequestOrigin}`);
  
  for (const domain of ALLOWED_DOMAINS) {
    const normalizedDomain = normalizeUrlForComparison(domain);
    const pattern = normalizedDomain.replace(/\*/g, '.*');
    const regex = new RegExp(`^${pattern}$`);
    const matches = regex.test(normalizedRequestOrigin);
    debugInfo.push(`   · 尝试匹配 "${domain}" -> ${matches ? '✅ 成功' : '❌ 失败'}`);
    if (matches) {
      isAllowed = true;
      break;
    }
  }
  } else {
    debugInfo.push(`[注意] 请求来源 (requestOrigin) 为 null，开始检查 Host: ${requestHost}`);
    if (requestHost) {
    // 将 ALLOWED_DOMAINS 中的URL转换为纯主机名进行匹配
    for (const domain of ALLOWED_DOMAINS) {
      try {
        const domainUrl = new URL(domain); // 例如将 ‘http://localhost:3000‘ 转为 URL 对象
        const domainHost = domainUrl.host; // 得到 ‘localhost:3000‘
        // 支持通配符主机名匹配（例如 ‘*.vercel.app‘ 匹配 ‘xxx.vercel.app‘）
        const pattern = domainHost.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        const matches = regex.test(requestHost);
        debugInfo.push(`   · 尝试匹配 Host "${domainHost}" -> ${matches ? '✅ 成功' : '❌ 失败'}`);
        if (matches) {
          isAllowed = true;
          break;
        }
      } catch (e) {
        // 如果 URL 解析失败（例如格式不对），跳过该条规则
        debugInfo.push(`   · 跳过无效的白名单条目: ${domain}`);
      }
    }
  }
  }
  debugInfo.push(`[3] 最终白名单检查结果 (isAllowed): ${isAllowed}`);

  // --- 4. 调试模式：直接返回详细的验证信息 ---
  if (isDebugMode) {
    return new NextResponse(
      JSON.stringify({ debugInfo }, null, 2), // 格式化输出，更易读
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // --- 5. 正常模式：验证失败则拒绝请求 ---
  if (!isAllowed) {
    // 在生产环境中返回简洁的错误信息
    return new NextResponse(
      JSON.stringify({ error: 'Forbidden: Hotlinking not allowed.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // --- 6. 验证通过，开始处理图片代理 ---
  const imageId = searchParams.get('id');
  const width = searchParams.get('width');

  if (!imageId) {
    return new NextResponse(
      JSON.stringify({ error: 'Image ID is required.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 从环境变量获取项目配置
  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

  // 解码ID，并构建真实的Sanity图片URL
  const decodedId = decodeURIComponent(imageId);
  let sanityImageUrl = `https://cdn.sanity.io/images/${projectId}/${dataset}/${decodedId}`;

  // 处理图片转换参数（如宽度）
  const params = new URLSearchParams();
  if (width) params.set('w', width); // 将 width 转换为 Sanity 的参数 'w'
  // 可以在此添加其他参数，例如：if (height) params.set('h', height);

  const paramString = params.toString();
  if (paramString) {
    sanityImageUrl += `?${paramString}`;
  }

  try {
    // 代理请求：向Sanity CDN获取图片
    const imageResponse = await fetch(sanityImageUrl);

    if (!imageResponse.ok) {
      // 如果Sanity返回错误（例如图片不存在）
      throw new Error(`Failed to fetch image from Sanity: ${imageResponse.status}`);
    }

    // 获取Sanity返回的图片数据和响应头
    const imageData = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // 将图片响应返回给前端浏览器
    return new NextResponse(imageData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // 设置缓存头，提升性能（例如缓存1天）
        'Cache-Control': 'public, max-age=86400',
        // 注意：这里使用具体的允许来源，比通配符更安全
        'Access-Control-Allow-Origin': requestOrigin || ALLOWED_DOMAINS.find(d => !d.includes('*')) || '',
      },
    });

  } catch (error) {
    console.error('Image proxy error:', error);
    // 生产环境可记录错误，但返回给用户的错误信息应保持简洁
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}