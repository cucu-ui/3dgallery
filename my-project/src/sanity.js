// src/sanity.js 或者是你定义的 client 文件
import { createClient } from "@sanity/client";
import createImageUrlBuilder from "@sanity/image-url"; // 修改这一行

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-05-03';

if (!projectId) {
  throw new Error(
    `缺少必要的环境变量: NEXT_PUBLIC_SANITY_PROJECT_ID。请在 .env.local 文件或部署平台中配置。`
  );
}
if (!dataset) {
  console.warn('未指定数据集，将使用默认值 "production"。请设置 NEXT_PUBLIC_SANITY_DATASET。');
}

export const client = createClient({
  projectId,
  dataset: dataset,
  useCdn: true, // 建议生产环境开启CDN加速
  apiVersion,
  // 如有需要，可在此添加 token: process.env.SANITY_API_TOKEN （切勿使用 NEXT_PUBLIC_ 前缀！）
});
const builder = createImageUrlBuilder(client);
export const urlFor = (source) => builder.image(source);