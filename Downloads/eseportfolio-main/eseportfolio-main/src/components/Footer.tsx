import { Github, Linkedin, Mail, Heart } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 border-t border-border bg-card/50">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div className="space-y-4">
              <h3 className="text-xl font-playfair font-semibold gradient-text">
                Eseoghene Emerorota
              </h3>
              <p className="text-muted-foreground">
                Front end Engineer & Project Manager passionate about creating and managing
                beautiful, functional digital experiences.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="font-semibold">Quick Links</h4>
              <nav className="space-y-2">
                <a 
                  href="#about" 
                  className="block text-muted-foreground hover:text-primary transition-colors"
                >
                  About
                </a>
                <a 
                  href="#projects" 
                  className="block text-muted-foreground hover:text-primary transition-colors"
                >
                  Projects
                </a>
                <a 
                  href="#contact" 
                  className="block text-muted-foreground hover:text-primary transition-colors"
                >
                  Contact
                </a>
              </nav>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h4 className="font-semibold">Connect</h4>
              <div className="flex space-x-4">
                <a
                  href="https://github.com/Ese345"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-background border border-border rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="https://www.linkedin.com/in/eseoghene-emerorota-0b69a6268"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-background border border-border rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href="mailto:esegift345@gmail.com"
                  className="p-2 bg-background border border-border rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                >
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-muted-foreground text-sm flex items-center">
              © {currentYear} Eseoghene Eme              href="https://www.linkedin.com/in/eseoghene-emerorota-0b69a6268"rorota . Made with 
              <Heart className="w-4 h-4 mx-1 text-red-500" /> 
              and passion.
            </p>
            <p className="text-muted-foreground text-sm">
              Built with React, TypeScript & Tailwind CSS
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;