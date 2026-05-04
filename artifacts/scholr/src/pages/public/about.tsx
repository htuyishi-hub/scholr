import { MessageCircle, Target, Globe, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function About() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-16 max-w-4xl">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
          <Target size={14} />
          Our Mission
        </div>
        <h1 className="font-serif text-5xl font-bold mb-6">
          We believe every student deserves
          <span className="text-primary"> world-class funding.</span>
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
          scholr was built by a team of former scholarship recipients who spent too many hours hunting for opportunities scattered across hundreds of websites.
          We decided to build the platform we wished existed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {[
          { icon: Globe, title: "Global Reach", desc: "Opportunities from 45+ countries, updated daily by our editorial team." },
          { icon: Target, title: "Curated Quality", desc: "Every listing is verified and enriched with details you actually need." },
          { icon: Users, title: "Community First", desc: "Join thousands of students supporting each other through WhatsApp groups." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-card border border-border rounded-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Icon size={22} className="text-primary" />
            </div>
            <h3 className="font-serif font-bold text-lg mb-2">{title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 md:p-12 text-center">
        <h2 className="font-serif text-3xl font-bold mb-4">Need help with your application?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Our team is available on WhatsApp to answer questions about any opportunity listed on scholr.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="rounded-full font-semibold gap-2 bg-[#25D366] hover:bg-[#25D366]/90 text-white">
            <a href="https://wa.me/1234567890?text=Hi%20scholr!%20I%20need%20help%20with%20a%20scholarship%20application." target="_blank" rel="noopener noreferrer" data-testid="btn-about-whatsapp">
              <MessageCircle size={18} />
              Chat with Us on WhatsApp
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full gap-2">
            <a href="/browse" data-testid="btn-about-browse">
              Browse Opportunities <ArrowRight size={16} />
            </a>
          </Button>
        </div>
      </div>

      <div className="mt-12 text-center text-muted-foreground text-sm">
        <p>Built with care for students everywhere.</p>
        <p className="mt-1">Contact: <a href="mailto:help@scholr.io" className="text-primary hover:underline">help@scholr.io</a></p>
      </div>
    </div>
  );
}
