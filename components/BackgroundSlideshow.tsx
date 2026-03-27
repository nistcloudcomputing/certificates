"use client";

import { useEffect, useState } from "react";

type BackgroundSlideshowProps = {
  images: string[];
  intervalMs?: number;
};

export default function BackgroundSlideshow({ images, intervalMs = 6500 }: BackgroundSlideshowProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) {
      return;
    }

    const timer = setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % images.length);
    }, intervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [images, intervalMs]);

  return (
    <div className="absolute inset-0">
      {images.map((imageUrl, imageIndex) => (
        <div
          key={`${imageUrl}-${imageIndex}`}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[1400ms] ease-out ${
            imageIndex === activeIndex ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      ))}
    </div>
  );
}
