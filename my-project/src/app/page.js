"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { client, urlFor } from '@/sanity'; 

export default function GalleryPage() {
  const [groups, setGroups] = useState([]); 
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
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

  if (loading) return <div className="text-center mt-20 text-stone-400 font-sans">正在翻开相册...</div>;

  return (
    <div className="max-w-5xl mx-auto py-10 relative">
      {/* 缩略图列表 */}
      {groups.map((group) => (
        <div key={group.year} className="flex mb-16 items-start">
          <div className="w-40 sticky top-24 text-4xl font-bold text-stone-300/80 italic font-sans">
            {group.year}
          </div>
          <div className="flex flex-wrap gap-4 flex-1">
            {group.photos.map((photo,index) => (
              <motion.div
                key={photo._id}
                layoutId={`card-${photo._id}`} // 增加前缀确保唯一
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
          <div className="fixed inset-0 z-[100]">
            {/* 1. 背景遮罩 */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
              className="fixed inset-0 bg-stone-100/90 backdrop-blur-md cursor-pointer"
            />
            
            {/* 2. 放大后的卡片 */}
            <motion.div
              layoutId={`card-${selectedId._id}`}
              
              style={{
                position: 'fixed',
                left: '40%',
                top: '20%',
                x: '-30%',
                y: '-30%',
              }}
              initial={{ opacity: 0, scale: 0.8}}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8}}
              className="z-[110] paper-card p-4 shadow-2xl w-[90vw] max-w-[500px] h-auto bg-[#f9f7f2] group cursor-default"
              onClick={(e) => e.stopPropagation()} 
            >
              <div className="w-full overflow-hidden rounded-md bg-white">
                <img 
                  src={urlFor(selectedId.image).width(1000).url()} 
                  className="w-full h-auto max-h-[65vh] object-contain cursor-zoom-out"
                  alt="enlarged"
                  onClick={() => setSelectedId(null)}
                />
              </div>
              
              {/* 信息展示区域：点击图片后再展示文字，增加一点飞入动画 */}
              <div className="mt-6 pb-2 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <p className="text-stone-700 font-medium text-lg">
                  {selectedId.description}
                </p>
                <p className="text-xs text-stone-400 mt-2 tracking-widest font-sans">
                  {selectedId.visitDate}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}