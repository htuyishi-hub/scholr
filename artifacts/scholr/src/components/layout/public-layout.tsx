import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { MessageCircle, Menu, X, User, GraduationCap, LogOut, Briefcase } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useStudent } from "@/hooks/use-student-auth";
import { Seo } from "@/components/seo";

const WA_NUMBER = "250723611110";
const WA_GROUP = "https://chat.whatsapp.com/GBKpjZSDCEk74RPTZje3hX";
const WA_CHAT = `https://wa.me/${WA_NUMBER}?text=Hi%20Scholr!%20I%20need%20help%20with%20a%20scholarship.`;

// Social media links — update URLs when accounts are created
const SOCIALS = [
  {
    name: "WhatsApp Group",
    href: WA_GROUP,
    color: "#25D366",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://instagram.com/scholr.ink",
    color: "#E1306C",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    name: "X (Twitter)",
    href: "https://x.com/scholr_rw",
    color: "#000000",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com/company/scholr-rw",
    color: "#0A66C2",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://facebook.com/scholr.ink",
    color: "#1877F2",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    href: "https://tiktok.com/@scholr.ink",
    color: "#010101",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
];

export function PublicLayout({ children }: { children: ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { student, logout } = useStudent();
  const pageSeo = (() => {
    if (location === "/") {
      return {
        title: "Scholarships, Fellowships & Grants | scholr",
        description: "Find verified scholarships, fellowships, grants and jobs from around the world, curated for ambitious students.",
        path: "/",
      };
    }
    if (location.startsWith("/browse")) {
      return {
        title: "Browse Scholarships & Fellowships | scholr",
        description: "Browse verified scholarships, fellowships, grants and internships by category, country, funding type and deadline.",
        path: "/browse",
      };
    }
    if (location.startsWith("/jobs")) {
      return {
        title: "Jobs, Internships & Career Opportunities | scholr",
        description: "Discover jobs, internships and career opportunities in Rwanda and beyond, with practical details for every application.",
        path: "/jobs",
      };
    }
    if (location.startsWith("/find-my-scholarship")) {
      return {
        title: "Find Scholarships That Match You | scholr",
        description: "Answer six quick questions to discover scholarships and funding opportunities matched to your study goals.",
        path: "/find-my-scholarship",
      };
    }
    if (location.startsWith("/about")) {
      return {
        title: "About scholr | Curated Student Funding",
        description: "Learn how scholr helps students find verified scholarships, fellowships and grants without searching hundreds of websites.",
        path: "/about",
      };
    }
    if (location.startsWith("/login")) {
      return { title: "Student Login | scholr", description: "Sign in to your scholr account to track applications and find matched scholarships.", path: "/login" };
    }
    if (location.startsWith("/register")) {
      return { title: "Create a Student Account | scholr", description: "Create a free scholr account to find and apply to scholarships tailored to your goals.", path: "/register" };
    }
    if (location.startsWith("/dashboard")) {
      return { title: "Student Dashboard | scholr", description: "Manage your scholr profile, matched opportunities and application progress.", path: "/dashboard", noindex: true };
    }
    if (location.startsWith("/profile")) {
      return { title: "Student Profile | scholr", description: "Keep your scholr student profile up to date for better scholarship matches.", path: "/profile", noindex: true };
    }
    return { title: "scholr — Student Funding Opportunities", description: "Verified scholarships, fellowships, grants and jobs for ambitious students worldwide.", path: location };
  })();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-primary-foreground">
      <Seo {...pageSeo} />
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent ${
          isScrolled ? "bg-background/80 backdrop-blur-md border-border shadow-sm py-3" : "bg-transparent py-5"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-serif font-bold text-xl transition-transform group-hover:scale-105">
              S
            </div>
            <span className="font-serif font-bold text-2xl tracking-tight">scholr.</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/browse" className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith("/browse") ? "text-primary" : "text-muted-foreground"}`}>
              Browse
            </Link>
            <Link href="/jobs" className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5 ${location.startsWith("/jobs") ? "text-primary" : "text-muted-foreground"}`}>
              <Briefcase size={14} /> Jobs
            </Link>
            <Link href="/find-my-scholarship" className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith("/find-my-scholarship") ? "text-primary" : "text-muted-foreground"}`}>
              Find My Match
            </Link>
            <Link href="/about" className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith("/about") ? "text-primary" : "text-muted-foreground"}`}>
              About
            </Link>
            {student ? (
              <div className="flex items-center gap-3">
                <Button asChild variant="ghost" size="sm" className="gap-2">
                  <Link href="/dashboard">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    {student.name.split(" ")[0]}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm"><Link href="/login">Sign In</Link></Button>
                <Button asChild size="sm" className="rounded-full font-semibold"><Link href="/register">Get Started</Link></Button>
              </div>
            )}
          </nav>

          <button
            type="button"
            className="md:hidden text-foreground p-2 min-h-11 min-w-11 flex items-center justify-center"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-card border-b border-border shadow-lg py-4 px-4 flex flex-col gap-2">
            <Link href="/browse" className="text-base font-medium py-2 px-4 rounded-md hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>Browse Opportunities</Link>
            <Link href="/jobs" className="text-base font-medium py-2 px-4 rounded-md hover:bg-muted flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}><Briefcase size={16} /> Jobs</Link>
            <Link href="/find-my-scholarship" className="text-base font-medium py-2 px-4 rounded-md hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>Find My Match</Link>
            <Link href="/about" className="text-base font-medium py-2 px-4 rounded-md hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
            {student ? (
              <>
                <Link href="/dashboard" className="text-base font-medium py-2 px-4 rounded-md hover:bg-muted flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}><User size={16} /> My Dashboard</Link>
                <Link href="/profile" className="text-base font-medium py-2 px-4 rounded-md hover:bg-muted flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}><GraduationCap size={16} /> My Profile</Link>
                <button onClick={handleLogout} className="text-left text-base font-medium py-2 px-4 rounded-md hover:bg-muted text-muted-foreground flex items-center gap-2"><LogOut size={16} /> Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-base font-medium py-2 px-4 rounded-md hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                <Button asChild className="w-full mt-2" onClick={() => setMobileMenuOpen(false)}><Link href="/register">Get Started Free</Link></Button>
              </>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 pt-24">{children}</main>

      {/* Footer */}
      <footer className="bg-card border-t border-border pt-16 pb-8 mt-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-10">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4 group inline-flex">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-serif font-bold text-xl">S</div>
                <span className="font-serif font-bold text-2xl tracking-tight">scholr.</span>
              </Link>
              <p className="text-muted-foreground text-sm max-w-sm leading-relaxed mb-6">
                Where serious students find life-changing funding. Curated scholarships, fellowships, and grants from around the globe.
              </p>

              {/* Social icons */}
              <div className="flex items-center gap-3 flex-wrap">
                {SOCIALS.map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={s.name}
                    aria-label={s.name}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 hover:shadow-lg"
                    style={{ backgroundColor: s.color + "20", color: s.color }}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>

              {/* WhatsApp CTA */}
              <div className="mt-6 flex flex-col gap-2">
                <a
                  href={WA_CHAT}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[#25D366] hover:underline font-medium"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Chat with us: +250 723 611 110
                </a>
                <a
                  href={WA_GROUP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[#25D366] hover:underline font-medium"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Join our WhatsApp community
                </a>
              </div>
            </div>

            {/* Platform links */}
            <div>
              <h4 className="font-serif font-semibold text-lg mb-4">Platform</h4>
              <ul className="space-y-3">
                <li><Link href="/browse" className="text-muted-foreground hover:text-primary text-sm transition-colors">All Opportunities</Link></li>
                <li><Link href="/jobs" className="text-muted-foreground hover:text-primary text-sm transition-colors">Jobs</Link></li>
                <li><Link href="/find-my-scholarship" className="text-muted-foreground hover:text-primary text-sm transition-colors">Find My Match</Link></li>
                <li><Link href="/register" className="text-muted-foreground hover:text-primary text-sm transition-colors">Create Account</Link></li>
              </ul>
            </div>

            {/* Company links */}
            <div>
              <h4 className="font-serif font-semibold text-lg mb-4">Company</h4>
              <ul className="space-y-3">
                <li><Link href="/about" className="text-muted-foreground hover:text-primary text-sm transition-colors">About Us</Link></li>
                <li>
                  <a href={WA_CHAT} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                    Contact Us
                  </a>
                </li>
                <li><Link href="/admin/login" className="text-muted-foreground hover:text-primary text-sm transition-colors">Admin Login</Link></li>
              </ul>

              {/* WhatsApp channel placeholder */}
              <div className="mt-6">
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium">WhatsApp Channel</p>
                <a
                  href={WA_GROUP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 rounded-lg px-3 py-2 hover:bg-[#25D366]/20 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Join Scholr Community
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} scholr. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-xs">Terms</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-xs">Privacy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button — opens direct chat */}
      <a
        href={WA_CHAT}
        target="_blank"
        rel="noopener noreferrer"
        title="Chat with Scholr on WhatsApp"
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366] focus:ring-offset-background"
      >
        <MessageCircle size={28} />
      </a>
    </div>
  );
}
