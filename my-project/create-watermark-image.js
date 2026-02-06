// my-project/create-watermark-image.js
import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建水印图片
const canvas = createCanvas(200, 60);
const ctx = canvas.getContext('2d');

// 透明背景
ctx.clearRect(0, 0, canvas.width, canvas.height);

// 绘制半透明圆角矩形背景
ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
const borderRadius = 8;
ctx.beginPath();
ctx.moveTo(borderRadius, 0);
ctx.lineTo(canvas.width - borderRadius, 0);
ctx.quadraticCurveTo(canvas.width, 0, canvas.width, borderRadius);
ctx.lineTo(canvas.width, canvas.height - borderRadius);
ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - borderRadius, canvas.height);
ctx.lineTo(borderRadius, canvas.height);
ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - borderRadius);
ctx.lineTo(0, borderRadius);
ctx.quadraticCurveTo(0, 0, borderRadius, 0);
ctx.closePath();
ctx.fill();

// 绘制文字
ctx.font = 'bold 30px sans-serif';
ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

// 添加文字阴影
ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
ctx.shadowBlur = 4;
ctx.shadowOffsetX = 2;
ctx.shadowOffsetY = 2;

// 绘制文字
ctx.fillText('@MUPICS', canvas.width / 2, canvas.height / 2);

// 保存为PNG
const buffer = canvas.toBuffer('image/png');
const outputPath = path.join(__dirname, 'public', 'watermark.png');

// 确保目录存在
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(outputPath, buffer);

console.log('✅ 水印图片已创建:', outputPath);
console.log('图片尺寸:', canvas.width, 'x', canvas.height);
console.log('文件大小:', buffer.length, 'bytes');