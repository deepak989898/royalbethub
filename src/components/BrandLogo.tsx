import Image from "next/image";

type Props = {
  className?: string;
  priority?: boolean;
};

const SRC = "/brand/royalbethub-logo.png";

export function BrandLogo({ className = "", priority = false }: Props) {
  return (
    <span className={`relative inline-flex shrink-0 items-center ${className}`}>
      <Image
        src={SRC}
        alt="RoyalBetHub — WIN LIKE ROYALTY"
        width={280}
        height={112}
        priority={priority}
        className="h-10 w-auto max-w-[200px] object-contain sm:h-12 sm:max-w-[240px]"
        sizes="(max-width: 640px) 200px, 280px"
      />
    </span>
  );
}
