import { Linkedin } from "lucide-react";

type IconProps = {
  className?: string;
};

export function LinkedInIcon({ className }: IconProps) {
  return <Linkedin className={className} strokeWidth={1.6} />;
}

export function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.244 2H21l-6.3 7.2L22 22h-6.8l-5.3-6.7L3.8 22H1l6.9-8L2 2h6.9l4.6 5.9L18.244 2z"
      />
    </svg>
  );
}
