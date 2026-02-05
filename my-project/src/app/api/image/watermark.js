// src/app/api/image/watermark.js
import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';

/**
 * 为图片Buffer添加文字水印
 * @param {Buffer} imageBuffer - 原始的图片二进制数据
 * @param {Object} options - 水印配置选项
 * @param {string} [options.text='@YourSite'] - 水印文字
 * @param {string} [options.position='bottom-right'] - 水印位置: 'center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'
 * @param {number} [options.fontSize=24] - 基础字体大小（会根据图片尺寸自动调整）
 * @param {string} [options.fontFamily='Arial'] - 字体，确保部署环境存在该字体
 * @param {string} [options.color='rgba(255, 255, 255, 0.6)'] - 水印颜色和透明度
 * @param {number} [options.padding=20] - 水印与图片边缘的间距（当位置在边角时）
 * @returns {Promise<Buffer>} - 添加水印后的图片Buffer
 */
export async function addWatermarkToImage(imageBuffer, options = {}) {
  // 合并默认选项和用户选项
  const {
    text = '@MUPICS', // 请将 YourSite 改为你的网站名或水印内容
    position = 'bottom-right',
    fontSize = 24,
    fontFamily = 'Arial',
    color = 'rgba(255, 255, 255, 0.6)',
    padding = 20
  } = options;

  // 1. 加载原始图片
  const image = await loadImage(imageBuffer);
  
  // 2. 创建Canvas画布，尺寸与原始图片相同
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  
  // 3. 将原始图片绘制到Canvas上
  ctx.drawImage(image, 0, 0);
  
  // 4. 设置水印文字样式
  // 动态计算字体大小：确保在超大或超小图片上都有合适比例
  const calculatedFontSize = Math.max(fontSize, Math.min(image.width, image.height) * 0.03);
  ctx.font = `bold ${calculatedFontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic'; // 标准的文本基线
  
  // 5. 测量水印文字的宽度
  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;
  const textHeight = calculatedFontSize; // 字体高度近似值
  
  // 6. 根据设定的位置计算水印坐标
  let x, y;
  switch (position) {
    case 'center':
      x = (image.width - textWidth) / 2;
      y = (image.height + textHeight / 2) / 2;
      break;
    case 'top-left':
      x = padding;
      y = padding + textHeight;
      break;
    case 'top-right':
      x = image.width - textWidth - padding;
      y = padding + textHeight;
      break;
    case 'bottom-left':
      x = padding;
      y = image.height - padding;
      break;
    case 'bottom-right':
    default:
      x = image.width - textWidth - padding;
      y = image.height - padding;
      break;
  }
  
  // 7. 绘制水印文字（可选的：添加一个淡淡的文字阴影提升可读性）
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 2;
  ctx.fillText(text, x, y);
  
  // 8. 将Canvas转换回图片Buffer并返回
  return canvas.toBuffer('image/jpeg', { quality: 0.95 }); // 保持高质量输出
}