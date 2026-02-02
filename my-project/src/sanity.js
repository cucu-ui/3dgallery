// src/sanity.js 或者是你定义的 client 文件
import { createClient } from "@sanity/client";
import createImageUrlBuilder from "@sanity/image-url"; // 修改这一行

export const client = createClient({
  projectId: "s1kooj2x",
  dataset: "production",
  useCdn: true,
  apiVersion: "2023-05-03",
});

const builder = createImageUrlBuilder(client);
export const urlFor = (source) => builder.image(source);