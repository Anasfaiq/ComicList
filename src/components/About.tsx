import type { NavigateFn } from "../types";

interface AboutProps {
  navigate: NavigateFn;
}

const About = ({ navigate }: AboutProps) => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 pb-24 lg:pb-10">
      {/* Back */}
      <button
        onClick={() => navigate("home")}
        className="flex items-center gap-1.5 text-sm text-(--cl-text-muted) hover:opacity-80 mb-8 transition"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M15 6l-6 6l6 6" />
        </svg>
        Back
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-(--cl-text) font-heading mb-2">
          About ComicList
        </h1>
        <p className="text-(--cl-text-muted) text-sm leading-relaxed">
          A platform to store and track your favorite manga, manhwa, and manhua.
          Created because there wasn’t anything simple enough to keep track of
          comic reading.
        </p>
      </div>

      {/* Tech Stack */}
      <div className="bg-(--cl-surface) border border-(--cl-border) rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-bold text-(--cl-text) uppercase tracking-wider mb-4">
          Tech Stack
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "React 19 + TypeScript", desc: "Frontend framework" },
            { label: "Tailwind CSS v4", desc: "Styling" },
            { label: "Supabase", desc: "Database, Auth & Storage" },
            { label: "AniList API", desc: "Comic data source" },
            { label: "Vite", desc: "Build tool" },
            { label: "Vercel", desc: "Deployment" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-(--cl-text)">
                {item.label}
              </span>
              <span className="text-xs text-(--cl-text-muted)">
                {item.desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="bg-(--cl-surface) border border-(--cl-border) rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-bold text-(--cl-text) uppercase tracking-wider mb-4">
          Features
        </h2>
        <div className="space-y-2">
          {[
            "Browse manga, manhwa & manhua from AniList",
            "Save comics to your personal reading list",
            "1–10 star rating system",
            "Community reviews & replies",
            "Manually upload comics not available on AniList",
            "Dark mode & light mode",
            "Visit other users' profiles",
          ].map((f) => (
            <div
              key={f}
              className="flex items-center gap-2 text-sm text-(--cl-text-muted)"
            >
              <span className="text-(--cl-primary)">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={24}
                  height={24}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="icon icon-tabler icons-tabler-outline icon-tabler-check"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M5 12l5 5l10 -10" />
                </svg>
              </span>
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Author */}
      <div className="bg-(--cl-surface) border border-(--cl-border) rounded-2xl p-5">
        <h2 className="text-sm font-bold text-(--cl-text) uppercase tracking-wider mb-4">
          Made by
        </h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-(--cl-primary) flex items-center justify-center text-white font-bold text-lg">
            A
          </div>
          <div>
            <p className="font-semibold text-(--cl-text)">Anas F.</p>
            <p className="text-xs text-(--cl-text-muted)">Web Developer</p>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex flex-wrap gap-2">
          {[
            {
              label: "GitHub",
              href: "https://github.com/anasfaiq",
              icon: (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="icon icon-tabler icons-tabler-outline icon-tabler-brand-github"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5" />
                </svg>
              ),
            },
            {
              label: "Instagram",
              href: "https://www.instagram.com/ansfqq08",
              icon: (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="icon icon-tabler icons-tabler-outline icon-tabler-brand-instagram"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M4 8a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4l0 -8" />
                  <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
                  <path d="M16.5 7.5v.01" />
                </svg>
              ),
            },
            {
              label: "Suggestions",
              href: "mailto:comiclist.direct@gmail.com",
              icon: (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="icon icon-tabler icons-tabler-outline icon-tabler-mail"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10" />
                  <path d="M3 7l9 6l9 -6" />
                </svg>
              ),
            },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm border border-(--cl-border) rounded-lg
                         text-(--cl-text-muted) hover:bg-(--cl-surface-2) transition"
            >
              {link.icon}
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;
