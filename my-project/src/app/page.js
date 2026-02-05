"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { client, urlFor } from '@/sanity'; 

function getImageId(imageObject) {
  // Sanity的image对象中，asset._ref 格式通常是："image-图片ID-尺寸.扩展名"
  // 例如：image-0bd20fad-3750x2500-jpg
  const ref = imageObject?.asset?._ref;
  if (!ref) return '';
  // 移除开头的 'image-' 和文件扩展名，得到类似 "0bd20fad-3750x2500-jpg"
  const withoutImagePrefix = ref.replace('image-', '');
  const parts = withoutImagePrefix.split('-');
  const lastPart = parts.pop(); // 取出最后一部分，如 "jpg"
  const mainPart = parts.join('-'); // 剩余部分重新用 '-' 连接
  const formattedId = `${mainPart}.${lastPart}`; // 组合为 "哈希-尺寸.扩展名"
  return encodeURIComponent(formattedId); // 编码以防特殊字符
}

export default function GalleryPage() {
  const [groups, setGroups] = useState([]); 
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLargeImageLoaded, setIsLargeImageLoaded] = useState(false);
  
  const bgColors = [
  '#FFB37E', // 杏子橙
  '#B2D3A8', // 开心果绿
  '#D1BBFF', // 香芋紫
  '#FF7F71', // 珊瑚红
  '#FFD972'  // 暖蜜黄
  ];

  useEffect(() => {
    const query = `*[_type == "work"] | order(visitDate desc) { _id, image, description, visitDate }`;
    client.fetch(query).then(data => {
      const grouped = data.reduce((acc, item) => {
        const year = item.visitDate ? item.visitDate.toString().slice(0, 4) : "未知";
        if (!acc[year]) acc[year] = [];
        acc[year].push(item);
        return acc;
      }, {});
      const sortedGroups = Object.keys(grouped).sort((a, b) => b - a).map(year => ({ year, photos: grouped[year] }));
      setGroups(sortedGroups);
      setLoading(false);
    });
  }, []);
  useEffect(() => {
  // 当 selectedId 变化时（包括从 null 变为有值，即打开新弹窗），重置图片加载状态为 false
  
  setIsLargeImageLoaded(false);
  }, [selectedId]); // 依赖项是 selectedId，它变化时此 effect 会运行

  if (loading) return <div className="text-center mt-20 text-stone-400 font-sans">正在翻开相册...</div>;

  return (
    <div className="w-full md:max-w-5xl md:mx-auto px-4 sm:px-6 py-6 md:py-10 relative">
      {/* 缩略图列表 */}
      {groups.map((group) => (
        <div key={group.year} className="flex mb-16 items-start">
          <div className="w-20 md:w-40 sticky top-4 md:top-24 text-2xl md:text-4xl font-bold text-stone-300/80 italic font-sans">
            {group.year}
          </div>
          <div className="flex flex-wrap gap-4 flex-1">
            {group.photos.map((photo,index) => (
              <motion.div
                key={photo._id}
                //layoutId={`card-${photo._id}`} // 增加前缀确保唯一
                onClick={() => setSelectedId(photo)}
                className="paper-card thumb-size p-2 cursor-pointer relative overflow-hidden flex flex-col"
                style={{ backgroundColor: bgColors[index % bgColors.length] }} // index 可从 map 参数获取
                
                whileHover={{ y: -5, rotate: 2 }} 
              >
                {/*<div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                </div>*/}
                {/* 星星图案层 */}
                 <div className="absolute inset-0 star-pattern opacity-20 pointer-events-none"></div>
                {/* 文字信息层 */}
                <div className="h-8 flex-shrink-0 flex items-center justify-center pt-1 z-10">
                  <span className="text-[10px] tracking-tighter text-stone-600/60 font-mono">
                    {photo.visitDate ?
                      photo.visitDate.toString().slice(5, 10).replace('-', '/') : 
                      '--/--'
                    } 
                  </span>
                </div>

                <div className="flex-1 min-h-0 px-2 pb-2 z-10 flex items-center justify-center">
                  <div className="w-full h-full min-h-0 flex items-center justify-center">
                   <p className="w-full text-xs text-stone-700 font-medium leading-relaxed line-clamp-4 break-words whitespace-normal text-center overflow-hidden">
                    {photo.description}
                  </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {/* 放大交互层 - 直接放在主容器内，使用 fixed 布局 */}
      <AnimatePresence>
  {selectedId && (
    <>
      {/* 背景遮罩 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setSelectedId(null)}
        className="fixed inset-0 z-[100] bg-stone-100/90 backdrop-blur-md cursor-pointer"
      />
      
      {/* 放大后的卡片 */}
      <motion.div
        // 1. 关键：移除了 layoutId
        // 2. 初始状态：从非常小开始（scale: 0.2），位置在屏幕中央
        initial={{ 
          //opacity: 0, 
          scale: 0.2,
          x: "-50%",
          y: "-50%"
        }}
        // 3. 动画状态：放大到1，完全可见
        animate={{ 
          //opacity: 1, 
          scale: 1,
          x: "-50%",
          y: "-50%"
        }}
        exit={{ 
          opacity: 0, 
          scale: 0.2,
          x: "-50%",
          y: "-50%"
        }}
        // 4. 核心定位：通过 fixed + top/left + translate 实现绝对居中
        className={`fixed left-1/2 top-1/2 z-[110] p-4 shadow-2xl w-[90vw] max-w-[500px] max-h-[90vh] bg-[#f9f7f2] cursor-default flex flex-col overflow-y-auto transition-opacity duration-300 ${isLargeImageLoaded ? 'opacity-100' : 'opacity-10'}`}
        

        style={{
          // 将卡片中心点对准 top/left 定位点，确保缩放动画从中心进行
          transformOrigin: 'center center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 图片容器 */}
        <div className="w-full overflow-hidden rounded-md bg-white flex-shrink-0">
          <img
            src={`/api/image?id=${getImageId(selectedId.image)}&width=1000`}
            className="w-full h-auto max-h-[60vh] object-contain cursor-zoom-out"
            alt="enlarged"
            onClick={() => setSelectedId(null)}
            onLoad={() =>  {
              
              setIsLargeImageLoaded(true);}
            }
          />
        </div>

        {/* 信息区域 - 移动端直接显示 */}
        <div className="mt-4 md:mt-6 pb-2 text-center flex-shrink-0">
          <p className="text-stone-700 font-medium text-base md:text-lg">
            {selectedId.description}
          </p>
          <p className="text-xs text-stone-400 mt-2 tracking-widest font-sans">
            {selectedId.visitDate}
          </p>
          {/* 移动端关闭提示（可选） */}
          <p className="mt-4 text-xs text-stone-500 md:hidden">
            
          </p>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>
    </div>
  );
}