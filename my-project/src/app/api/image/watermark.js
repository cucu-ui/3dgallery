// src/app/api/image/watermark.js
import { createCanvas, loadImage } from 'canvas';
import path from 'path';
import fs from 'fs';

/**
 * 使用图片水印为图片Buffer添加水印
 * @param {Buffer} imageBuffer - 原始的图片二进制数据
 * @param {Object} options - 水印配置选项
 * @param {string} [options.position='bottom-right'] - 水印位置: 'center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'
 * @param {number} [options.scale=0.15] - 水印相对于原图宽度的比例（0-1）
 * @param {number} [options.opacity=0.7] - 水印透明度（0-1）
 * @param {number} [options.padding=20] - 水印与图片边缘的间距（当位置在边角时）
 * @returns {Promise<Buffer>} - 添加水印后的图片Buffer
 */
export async function addWatermarkToImage(imageBuffer, options = {}) {
  const {
    position = 'bottom-right',
    scale = 0.15, // 水印宽度占原图宽度的15%
    opacity = 0.7,
    padding = 20
  } = options;

  try {
    // 1. 加载原始图片
    const image = await loadImage(imageBuffer);
    
    // 2. 加载水印图片
    let watermarkImage;
    try {
      // 尝试从 public 目录加载水印图片
      const watermarkPath = path.join(process.cwd(), 'public', 'watermark.png');
      if (fs.existsSync(watermarkPath)) {
        watermarkImage = await loadImage(watermarkPath);
        console.log('✅ 水印图片加载成功');
      } else {
        throw new Error('水印图片文件不存在');
      }
    } catch (error) {
      console.warn('无法加载水印图片，使用备用方案:', error.message);
      
      // 备用方案：动态创建简单水印
      const backupCanvas = createCanvas(200, 60);
      const backupCtx = backupCanvas.getContext('2d');
      
      // 绘制背景
      backupCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      backupCtx.fillRect(0, 0, backupCanvas.width, backupCanvas.height);
      
      // 绘制简单文字
      backupCtx.font = 'bold 30px sans-serif';
      backupCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      backupCtx.textAlign = 'center';
      backupCtx.textBaseline = 'middle';
      backupCtx.fillText('@MUPICS', backupCanvas.width / 2, backupCanvas.height / 2);
      
      watermarkImage = backupCanvas;
    }
    
    // 3. 创建Canvas画布，尺寸与原始图片相同
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    
    // 4. 将原始图片绘制到Canvas上
    ctx.drawImage(image, 0, 0);
    
    // 5. 计算水印尺寸和位置
    const watermarkWidth = image.width * scale;
    const watermarkHeight = (watermarkImage.height / watermarkImage.width) * watermarkWidth;
    
    let x, y;
    
    switch (position) {
      case 'center':
        x = (image.width - watermarkWidth) / 2;
        y = (image.height - watermarkHeight) / 2;
        break;
      case 'top-left':
        x = padding;
        y = padding;
        break;
      case 'top-right':
        x = image.width - watermarkWidth - padding;
        y = padding;
        break;
      case 'bottom-left':
        x = padding;
        y = image.height - watermarkHeight - padding;
        break;
      case 'bottom-right':
      default:
        x = image.width - watermarkWidth - padding;
        y = image.height - watermarkHeight - padding;
        break;
    }
    
    // 6. 设置透明度并绘制水印图片
    ctx.globalAlpha = opacity;
    ctx.drawImage(
      watermarkImage,
      x, y,
      watermarkWidth, watermarkHeight
    );
    ctx.globalAlpha = 1.0;
    
    // 7. 可选：添加调试信息
    if (process.env.NODE_ENV === 'development') {
      console.log('水印参数:', {
        原图尺寸: `${image.width}x${image.height}`,
        水印尺寸: `${watermarkWidth.toFixed(0)}x${watermarkHeight.toFixed(0)}`,
        水印位置: { x: x.toFixed(0), y: y.toFixed(0) },
        透明度: opacity
      });
    }
    
    // 8. 将Canvas转换回图片Buffer并返回
    return canvas.toBuffer('image/jpeg', { quality: 0.95 });
    
  } catch (error) {
    console.error('❌ 水印处理失败:', error);
    
    // 如果水印处理失败，返回原始图片
    const image = await loadImage(imageBuffer);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    
    // 尝试绘制一个简单的水印作为最后的回退
    try {
      ctx.font = 'bold 30px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('@MUPICS', image.width - 150, image.height - 30);
    } catch (fallbackError) {
      console.warn('连简单水印也绘制失败:', fallbackError);
    }
    
    return canvas.toBuffer('image/jpeg', { quality: 0.95 });
  }
}

// 为了向后兼容，保留旧的函数名，但使用新的图片水印实现
// 如果你的route.js调用时有text参数，可以忽略它
export async function addWatermarkToImageLegacy(imageBuffer, options = {}) {
  // 忽略text参数，使用图片水印
  const { text, ...restOptions } = options;
  return addWatermarkToImage(imageBuffer, restOptions);
}