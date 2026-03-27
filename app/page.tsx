import fs from "node:fs";
import path from "node:path";
import BackgroundSlideshow from "@/components/BackgroundSlideshow";
import Card from "@/components/ui/Card";
import Form from "@/components/Form";
import Image from "next/image";

const BACKGROUND_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
type SocialIcon = "instagram" | "linkedin" | "facebook" | "youtube";
const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/cloudcomputingclub_official/",
    icon: "instagram" as SocialIcon,
  },
  {
    label: "LinkedIn",
    href: "http://linkedin.com/company/nist-cloud-computing-club/posts/?feedView=all",
    icon: "linkedin" as SocialIcon,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/ccc.nist",
    icon: "facebook" as SocialIcon,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@cloudcomputingclub",
    icon: "youtube" as SocialIcon,
  },
];

function SocialIcon({ icon }: { icon: SocialIcon }) {
  if (icon === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 sm:size-4 fill-current">
        <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 1.8A3.7 3.7 0 0 0 3.8 7.5v9a3.7 3.7 0 0 0 3.7 3.7h9a3.7 3.7 0 0 0 3.7-3.7v-9a3.7 3.7 0 0 0-3.7-3.7h-9Zm9.45 1.45a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 7.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6Zm0 1.8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
      </svg>
    );
  }

  if (icon === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 sm:size-4 fill-current">
        <path d="M4.98 3.5A2.48 2.48 0 1 1 4.98 8.46 2.48 2.48 0 0 1 4.98 3.5ZM3 9.75h3.96V21H3V9.75Zm7.02 0h3.8v1.54h.05c.53-1 1.82-2.06 3.74-2.06 4 0 4.74 2.63 4.74 6.05V21h-3.96v-5.04c0-1.2-.02-2.75-1.68-2.75-1.69 0-1.95 1.32-1.95 2.67V21h-4V9.75Z" />
      </svg>
    );
  }

  if (icon === "facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 sm:size-4 fill-current">
        <path d="M13.5 21v-7h2.3l.4-3h-2.7V9.1c0-.87.24-1.46 1.5-1.46h1.6V5.02C15.8 4.93 15.18 4.9 14.46 4.9c-2.15 0-3.63 1.32-3.63 3.74V11H8.4v3h2.43v7h2.67Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 sm:size-4 fill-current">
      <path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.5 12 4.5 12 4.5s-7 0-8.9.6A3 3 0 0 0 1 7.2 31.8 31.8 0 0 0 .5 12c0 1.6.2 3.2.5 4.8a3 3 0 0 0 2.1 2.1c1.9.6 8.9.6 8.9.6s7 0 8.9-.6a3 3 0 0 0 2.1-2.1c.3-1.6.5-3.2.5-4.8 0-1.6-.2-3.2-.5-4.8ZM9.75 15.8V8.2L16.5 12l-6.75 3.8Z" />
    </svg>
  );
}

function getBackgroundImageUrls() {
  const backgroundsFolder = path.join(process.cwd(), "public", "backgrounds");

  try {
    const files = fs.readdirSync(backgroundsFolder, { withFileTypes: true });

    return files
      .filter((file) => file.isFile() && BACKGROUND_IMAGE_EXTENSIONS.has(path.extname(file.name).toLowerCase()))
      .map((file) => `/backgrounds/${file.name}`)
      .sort();
  } catch {
    return [];
  }
}

export default function Home() {
  const bgImage = process.env.NEXT_PUBLIC_BG_IMAGE_URL;
  const clubLogoUrl = process.env.NEXT_PUBLIC_CLUB_LOGO_URL;
  const eventName = process.env.NEXT_PUBLIC_EVENT_NAME || "cloud vision, by cloud computing club";
  const backgroundImages = getBackgroundImageUrls();
  const fallbackBackground = bgImage
    ? `url(${bgImage})`
    : "linear-gradient(180deg, #060606 0%, #030303 48%, #000000 100%)";

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-10">
      {backgroundImages.length > 0 ? (
        <BackgroundSlideshow images={backgroundImages} />
      ) : (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: fallbackBackground }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/56 via-black/48 to-black/64" />
      <div className="absolute inset-x-0 top-0 h-[34vh] bg-gradient-to-b from-black/78 via-black/52 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,0,0,0.22),transparent_40%),radial-gradient(circle_at_50%_100%,rgba(0,0,0,0.2),transparent_42%)]" />
      <div className="noise-overlay absolute inset-0 opacity-20" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      <div className="pointer-events-none absolute -left-12 top-20 size-44 rounded-full bg-black/45 blur-3xl sm:-left-16 sm:size-56 blob-float" />
      <div className="pointer-events-none absolute -right-6 bottom-16 size-52 rounded-full bg-black/45 blur-3xl sm:right-0 sm:size-64 blob-float-delayed" />

      {clubLogoUrl ? (
        <a
          href="https://cloudcomputingclub.co.in"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit Cloud Computing Club website"
          className="absolute left-1/2 top-4 z-20 -translate-x-1/2 transition-opacity hover:opacity-90 sm:top-6"
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-100 sm:text-base">
              Cloud Computing Club
            </p>
            <div className="relative h-10 w-10 sm:h-12 sm:w-12">
              <Image
                src={clubLogoUrl}
                alt="Cloud Computing Club logo"
                fill
                sizes="(max-width: 640px) 40px, 48px"
                unoptimized
                className="object-contain"
              />
            </div>
          </div>
        </a>
      ) : null}

      <main className="relative z-10 w-full max-w-md md:max-w-lg">
        <Card className="mx-auto">
          <p className="mb-2 text-center text-xs font-medium uppercase tracking-[0.24em] text-zinc-300/85">
            {eventName}
          </p>
          <h1 className="bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-300 bg-clip-text text-center text-2xl font-semibold tracking-tight text-transparent md:text-4xl">
            Download your certifiate
          </h1>
          <p className="mt-3 text-center text-sm leading-6 text-zinc-300">
            Enter your registered details to securely verify and download your certificate.
          </p>
          <div className="mt-7">
            <Form />
          </div>
        </Card>
      </main>

      <div className="absolute bottom-4 left-1/2 z-20 w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 sm:bottom-5">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs font-medium sm:gap-x-4 sm:text-sm">
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-zinc-200/90 transition hover:text-zinc-50"
            >
              <SocialIcon icon={social.icon} />
              {social.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
