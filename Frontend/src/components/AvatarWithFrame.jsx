import { useEffect, useState } from "react";

export default function AvatarWithFrame({
  src = "",
  alt = "Avatar",
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

  const shellClass = `inline-flex rounded-full ${className}`.trim();
  const coreClass = `relative h-full w-full rounded-full overflow-hidden flex items-center justify-center ${coreClassName}`.trim();

  return (
    <div className={shellClass}>
      <div className={coreClass}>
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
