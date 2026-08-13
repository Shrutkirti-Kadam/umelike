/** The umelike wordmark, with its "like" ending in the berry accent. */
export function BrandName({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      ume<span className="text-berry">like</span>
    </span>
  );
}

/** The supplied U mark paired with the wordmark for navigation and headers. */
export function BrandLockup({
  className = "",
  markClassName = "h-9 w-9",
  wordmarkClassName = "",
}: {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/u-dark.svg"
        alt=""
        width={40}
        height={40}
        className={`shrink-0 rounded-[22%] shadow-[0_4px_14px_rgba(23,18,32,0.16)] ${markClassName}`}
      />
      <BrandName className={wordmarkClassName} />
    </span>
  );
}
