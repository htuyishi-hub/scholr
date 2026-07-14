import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { MessageCircle, Menu, X, User, GraduationCap, LogOut, Briefcase } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useStudent } from "@/hooks/use-student-auth";

export function PublicLayout({ children }: { children: ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { student, logout } = useStudent();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Force dark mode on document element
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {};
  }, []);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-primary-foreground">
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
            <Link
              href="/browse"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.startsWith("/browse") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Browse
            </Link>
            <Link
              href="/jobs"
              className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5 ${
                location.startsWith("/jobs") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Briefcase size={14} />
              Jobs
            </Link>
            <Link
              href="/find-my-scholarship"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.startsWith("/find-my-scholarship") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Find My Match
            </Link>
            <Link
              href="/about"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.startsWith("/about") ? "text-primary" : "text-muted-foreground"
              }`}
            >
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
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild size="sm" className="rounded-full font-semibold">
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            )}
          </nav>

          <button
            className="md:hidden text-foreground p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-card border-b border-border shadow-lg py-4 px-4 flex flex-col gap-2">
            <Link href="/browse" className="text-base font-medium py-2 px-4 rounded-md hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
              Browse Opportunities
            </Link>
            <Link href="/jobs" className="text-base font-medium py-2 px-4 rounded-md hover:bg-muted flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
              <Briefcase size={16} /> Jobs
            </Link>
            <Link href="/find-my-scholarship" className="text-base font-medium py-2 px-4 rounded-md hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
              Find My Match
            </Link>
            <Link href="/about" className="text-base font-medium py-2 px-4 rounded-md hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
              About Us
            </Link>
            {student ? (
              <>
                <Link href="/dashboard" className="text-base font-medium py-2 px-4 rounded-md hover:bg-muted flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <User size={16} /> My Dashboard
                </Link>
                <Link href="/profile" className="text-base font-medium py-2 px-4 rounded-md hover:bg-muted flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <GraduationCap size={16} /> My Profile
                </Link>
                <button onClick={handleLogout} className="text-left text-base font-medium py-2 px-4 rounded-md hover:bg-muted text-muted-foreground flex items-center gap-2">
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-base font-medium py-2 px-4 rounded-md hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
                  Sign In
                </Link>
                <Button asChild className="w-full mt-2" onClick={() => setMobileMenuOpen(false)}>
                  <Link href="/register">Get Started Free</Link>
                </Button>
              </>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 pt-24">{children}</main>

      <footer className="bg-card border-t border-border pt-16 pb-8 mt-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4 group inline-flex">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-serif font-bold text-xl">
                  S
                </div>
                <span className="font-serif font-bold text-2xl tracking-tight">scholr.</span>
              </Link>
              <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
                Where serious students find life-changing funding. Curated scholarships, fellowships, and grants from around the globe.
              </p>
            </div>
            <div>
              <h4 className="font-serif font-semibold text-lg mb-4">Platform</h4>
              <ul className="space-y-3">
                <li><Link href="/browse" className="text-muted-foreground hover:text-primary text-sm transition-colors">All Opportunities</Link></li>
                <li><Link href="/find-my-scholarship" className="text-muted-foreground hover:text-primary text-sm transition-colors">Find My Match</Link></li>
                <li><Link href="/register" className="text-muted-foreground hover:text-primary text-sm transition-colors">Create Account</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-serif font-semibold text-lg mb-4">Company</h4>
              <ul className="space-y-3">
                <li><Link href="/about" className="text-muted-foreground hover:text-primary text-sm transition-colors">About Us</Link></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">Contact</a></li>
                <li><Link href="/admin/login" className="text-muted-foreground hover:text-primary text-sm transition-colors">Admin Login</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} scholr. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-xs">Terms</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-xs">Privacy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/1234567890?text=Hi%20scholr!"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366] focus:ring-offset-background"
      >
        <MessageCircle size={28} />
      </a>
    </div>
  );
}
