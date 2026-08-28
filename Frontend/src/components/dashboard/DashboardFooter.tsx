import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Tractor,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube
} from "lucide-react";

const DashboardFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border mt-auto" role="contentinfo">
      {/* Mobile Compact Footer */}
      <div className="md:hidden px-4 py-3 text-center space-y-1.5">
        <div className="flex items-center justify-center space-x-1.5 text-xs text-muted-foreground">
          <Tractor className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">FarmIQ</span>
          <span>•</span>
          <span>AI Agricultural Assistant</span>
        </div>
        <div className="flex items-center justify-center space-x-3 text-[11px] text-muted-foreground">
          <span>© {currentYear} FarmIQ</span>
          <span>•</span>
          <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
          <span>•</span>
          <a href="/terms" className="hover:text-primary transition-colors">Terms</a>
          <span>•</span>
          <a href="mailto:farmiq.in@gmail.com" className="hover:text-primary transition-colors">Contact</a>
        </div>
      </div>

      {/* Desktop / Tablet Full Footer */}
      <div className="hidden md:block max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Tractor className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold text-foreground">FarmIQ</span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Empowering farmers with smart technology and data-driven insights for sustainable agriculture.
            </p>
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                <Facebook className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                <Twitter className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                <Instagram className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                <Youtube className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider">Quick Links</h3>
            <div className="flex flex-col space-y-1 text-xs">
              <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors py-0.5">About Us</a>
              <a href="#services" className="text-muted-foreground hover:text-foreground transition-colors py-0.5">Our Services</a>
              <a href="#stories" className="text-muted-foreground hover:text-foreground transition-colors py-0.5">Success Stories</a>
              <a href="#blog" className="text-muted-foreground hover:text-foreground transition-colors py-0.5">Farming Blog</a>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-2.5">
            <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider">Support</h3>
            <div className="flex flex-col space-y-1 text-xs">
              <a href="#help" className="text-muted-foreground hover:text-foreground transition-colors py-0.5">Help Center</a>
              <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors py-0.5">Contact Support</a>
              <a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors py-0.5">Privacy Policy</a>
              <a href="/terms" className="text-muted-foreground hover:text-foreground transition-colors py-0.5">Terms of Service</a>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-2.5">
            <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider">Contact Us</h3>
            <div className="flex flex-col space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>+91 86396 68662, +91 63059 36623</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>farmiq.in@gmail.com</span>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span>Agricultural Technology Hub, New Delhi, 110001</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Bottom Section */}
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <p>© {currentYear} FarmIQ. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default DashboardFooter;