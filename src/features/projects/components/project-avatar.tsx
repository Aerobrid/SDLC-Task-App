import Image from "next/image";
import React, { memo } from "react";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ProjectAvatarProps {
  image?: string | null;
  name: string;
  classname?: string;
  fallbackClassName?: string;
};

const isRenderableImage = (src?: string | null) => {
  if (!src) return false;
  if (src.startsWith("http") || src.startsWith("/")) return true;
  // blob: and data: URLs are renderable via <img>
  if (src.startsWith("blob:") || src.startsWith("data:")) return true;
  return false;
};

export const ProjectAvatar = memo(function ProjectAvatar({
  image,
  name,
  classname,
  fallbackClassName,
}: ProjectAvatarProps) {
  if (isRenderableImage(image)) {
    // use next/image for absolute/http or leading-slash URLs for optimization
    if (image && (image.startsWith("http") || image.startsWith("/"))) {
      return (
        <div className={cn("size-5 relative rounded-md overflow-hidden", classname)}>
          <Image src={image} alt={name} fill className="object-cover" />
        </div>
      );
    }

    // fallback for blob/data URLs
    return (
      <div className={cn("size-5 relative rounded-md overflow-hidden", classname)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image as string} alt={name} className="object-cover w-full h-full" />
      </div>
    );
  }

  return (
    <Avatar className={cn("size-5 rounded-md", classname)}>
      <AvatarFallback className={cn(
        "text-white bg-blue-600 font-semibold text-sm uppercase rounded-md",
        fallbackClassName,
      )}>
        {name[0]}
      </AvatarFallback>
    </Avatar>
  );
});