import { Link } from "wouter";
import { Github } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose md:text-left">
            Built with ❤️ for travelers. © {currentYear} TravelPal.
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 px-8 md:gap-6 md:px-0">
          <nav className="flex gap-4 md:gap-6">
            <Link className="text-sm hover:underline underline-offset-4" href="/privacy">
              Privacy
            </Link>
            <Link className="text-sm hover:underline underline-offset-4" href="/terms">
              Terms
            </Link>
            <Link className="text-sm hover:underline underline-offset-4" href="/contact">
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/your-repo"
              target="_blank"
              rel="noreferrer"
              className="text-sm hover:text-foreground/80"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}