"use client";

import { useState } from "react";

type RankImage = {
  id: number;
  signedUrl: string | null;
};

type RankImagesProps = {
  images: RankImage[];
};

export default function RankImages({ images }: RankImagesProps) {
  const [orderedImages, setOrderedImages] = useState(images);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDrop(dropIndex: number) {
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newOrder = [...orderedImages];
    const [draggedImage] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedImage);

    setOrderedImages(newOrder);
    setDraggedIndex(null);
  }

  return (
    <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {orderedImages.map((image, index) => (
        <div
          key={image.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => handleDrop(index)}
          onDragEnd={() => setDraggedIndex(null)}
          className={`overflow-hidden rounded-xl border cursor-grab active:cursor-grabbing transition ${
            draggedIndex === index ? "opacity-50" : ""
          }`}
        >
          <div className="px-4 py-3 font-bold text-xl border-b">
            {index + 1}. hely
          </div>

          {image.signedUrl ? (
            <img
              src={image.signedUrl}
              alt={`${index + 1}. helyezett kép`}
              draggable={false}
              className="w-full aspect-square object-cover select-none"
            />
          ) : (
            <div className="aspect-square flex items-center justify-center text-muted-foreground">
              A kép nem tölthető be
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
