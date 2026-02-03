import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET;

if (!projectId) {
  throw new Error(
    '缺少环境变量 SANITY_STUDIO_PROJECT_ID。请检查你的 .env 文件或部署平台设置。'
  );
}

export default defineConfig({
  name: 'default',
  title: '3dgallery',

  projectId,
  dataset: dataset,

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
