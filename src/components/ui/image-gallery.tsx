"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ImageGalleryProps = {
  images: string[];
  alt?: string;
  href?: string;
  className?: string;
  imageClassName?: string;
};

// Galerie de 5 images maximum (V1.5) : défilement horizontal natif, une image
// par vue, flèches + compteur. Aucune dépendance externe.
export function ImageGallery({
  images,
  alt = "Image",
  href,
  className,
  imageClassName,
}: ImageGalleryProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const goTo = useCallback(
    (next: number) => {
      const track = trackRef.current;
      if (!track) return;
      const clamped = Math.max(0, Math.min(images.length - 1, next));
      track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
      setIndex(clamped);
    },
    [images.length],
  );

  if (images.length === 0) return null;

  const image = (src: string, position: number) => (
    /* eslint-disable-next-line @next/next/no-img-element -- bucket public_read (F12, galerie V1.5) */
    <img
      src={src}
      alt={`${alt} ${position + 1} sur ${images.length}`}
      className={cn("bg-muted max-h-[32rem] w-full object-cover", imageClassName)}
      loading={position === 0 ? "eager" : "lazy"}
      draggable={false}
    />
  );

  if (images.length === 1) {
    return (
      <div className={cn("overflow-hidden rounded-[14px]", className)}>
        {href ? (
          <Link href={href} className="focus-visible:ring-ring block outline-none focus-visible:ring-2">
            {image(images[0], 0)}
          </Link>
        ) : (
          image(images[0], 0)
        )}
      </div>
    );
  }

  return (
    <div
      className={cn("group relative overflow-hidden rounded-[14px]", className)}
      role="group"
      aria-roledescription="carrousel"
      aria-label={`${images.length} images`}
    >
      <div
        ref={trackRef}
        onScroll={(event) => {
          const track = event.currentTarget;
          if (track.clientWidth === 0) return;
          setIndex(Math.round(track.scrollLeft / track.clientWidth));
        }}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, position) => (
          <div key={src} className="w-full shrink-0 snap-center">
            {href ? (
              <Link
                href={href}
                className="focus-visible:ring-ring block outline-none focus-visible:ring-2"
                tabIndex={position === index ? 0 : -1}
                aria-hidden={position === index ? undefined : true}
              >
                {image(src, position)}
              </Link>
            ) : (
              image(src, position)
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => goTo(index - 1)}
        disabled={index === 0}
        aria-label="Image précédente"
        className="bg-background/80 text-foreground hover:bg-background focus-visible:ring-ring absolute top-1/2 left-2 -translate-y-1/2 rounded-full p-1.5 shadow-sm backdrop-blur transition disabled:pointer-events-none disabled:opacity-0 focus-visible:ring-2"
      >
        <ChevronLeft className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => goTo(index + 1)}
        disabled={index === images.length - 1}
        aria-label="Image suivante"
        className="bg-background/80 text-foreground hover:bg-background focus-visible:ring-ring absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 shadow-sm backdrop-blur transition disabled:pointer-events-none disabled:opacity-0 focus-visible:ring-2"
      >
        <ChevronRight className="size-4" aria-hidden />
      </button>

      <span className="bg-foreground/70 text-background absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-medium">
        {index + 1}/{images.length}
      </span>
    </div>
  );
}
