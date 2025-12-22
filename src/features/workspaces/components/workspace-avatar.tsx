import Image from "next/image";
import React, { memo } from "react";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface WorkspaceAvatarProps {
  image?: string | null;
  name: string;
  classname?: string;
};

const isRenderableImage = (src?: string | null) => {
  if (!src) return false;
  if (src.startsWith("http") || src.startsWith("/")) return true;
  if (src.startsWith("blob:") || src.startsWith("data:")) return true;
  return false;
};

export const WorkspaceAvatar = memo(function WorkspaceAvatar({
  image,
  name,
  classname,
}: WorkspaceAvatarProps) {
  if (isRenderableImage(image)) {
    if (image && (image.startsWith("http") || image.startsWith("/"))) {
      return (
        <div className={cn("size-10 relative rounded-md overflow-hidden", classname)}>
          <Image src={image} alt={name} fill className="object-cover" />
        </div>
      );
    }

    return (
      <div className={cn("size-10 relative rounded-md overflow-hidden", classname)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image as string} alt={name} className="object-cover w-full h-full" />
      </div>
    );
  }

  return (
    <Avatar className={cn("size-10 rounded-md", classname)}>
      <AvatarFallback className="text-white bg-blue-600 font-semibold text-lg uppercase rounded-md">
        {name[0]}
      </AvatarFallback>
    </Avatar>
  );
});