// schemaTypes/work.js
export default {
  name: 'work',
  title: '作品',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: '名称',
      type: 'text',
    },

    {
      name: 'visitDate',
      title: '拍摄时间',
      type: 'date',
      options: {
        dateFormat: 'YYYY-MM-DD',  // 可选：自定义显示格式
      },
    },

    {
      name: 'description',
      title: '一句话',
      type: 'text',
    },
    {
      name: 'image',
      title: '作品图片',
      type: 'image',
      options: {
        hotspot: true, // 允许你在后台裁剪图片焦点
      },
    },
  ],
}