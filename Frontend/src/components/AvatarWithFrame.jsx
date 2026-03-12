import { useEffect, useState } from "react";

export default function AvatarWithFrame({
  src = "",
  alt = "Avatar",
  frame = "NONE",
  className = "",
  coreClassName = "",
  imageClassName = "",
  fallback = null,
  onError = null,
}) {
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  useEffect(() => {
    setImageLoadFailed(false);
  }, [src]);

  const showImage = Boolean(src) && !imageLoadFailed;

  return (
    <div className={`avatar-frame-shell ${className}`.trim()}>
      <div className={`avatar-frame-core ${coreClassName}`.trim()}>
        {showImage ? (
          <img
            src={src}
            alt={alt}
            className={`h-full w-full object-cover ${imageClassName}`.trim()}
            onError={(event) => {
              setImageLoadFailed(true);
              if (typeof onError === "function") onError(event);
            }}
          />
        ) : (
          fallback
        )}
      </div>
    </div>
  );
}
