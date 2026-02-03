import {defineCliConfig} from 'sanity/cli'

const projectId = process.env.SANITY_CLI_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID; // 可复用Studio的变量
const dataset = process.env.SANITY_CLI_DATASET || process.env.SANITY_STUDIO_DATASET || 'production';

if (!projectId) {
  console.warn(`
⚠️  未检测到项目ID环境变量（SANITY_CLI_PROJECT_ID 或 SANITY_STUDIO_PROJECT_ID）。
    CLI命令（如数据导入）可能无法执行。
    **解决方案：**
    1. 在项目根目录创建 .env 文件并添加：SANITY_CLI_PROJECT_ID="你的项目ID"
    2. 或者在运行命令时指定：sanity dataset export --project-id <你的项目ID>
  `);
}

export default defineCliConfig({
  api: {
    projectId,
    dataset
  },
  deployment: {
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/cli#auto-updates
     */
    autoUpdates: true,
  }
})
