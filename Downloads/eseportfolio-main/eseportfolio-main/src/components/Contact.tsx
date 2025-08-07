import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { useState } from "react";
import emailjs from "emailjs-com";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    emailjs
      .send(
        "service_ezff8np", // replace with your EmailJS service ID
        "template_ftj7nue", // replace with your EmailJS template ID
        {
          from_name: formData.name,
          from_email: formData.email,
          message: formData.message,
        },
        "tHSbYSzmg1cpfH9nr" // replace with your EmailJS public key (user ID)
      )
      .then(
        () => {
          setStatus("Message sent successfully!");
          setFormData({ name: "", email: "", message: "" });
        },
        (error) => {
          setStatus("Failed to send message. Please try again later.");
          console.error(error);
        }
      );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      value: "esegift345@gmail.com",
      href: "mailto:esegift345@gmail.com"
    },
    {
      icon: Phone,
      title: "Phone",
      value: "+234 907 767 4884",
      href: "tel:+2349077674884"
    },
    {
      icon: MapPin,
      title: "Location",
      value: "Abuja, Nigeria",
      href: "#"
    }
  ];

  return (
    <section id="contact" className="py-20 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6">
              Get In <span className="gradient-text">Touch</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto mb-8" />
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ready to bring your ideas to life? Let's discuss your next project and create something amazing together.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-semibold mb-4 font-playfair">Send a Message</h3>
                <p className="text-muted-foreground mb-6">
                  I'd love to hear about your project. Fill out the form and I'll get back to you within 24 hours.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {status && (
                  <div className={`text-sm mb-2 ${status.includes("success") ? "text-green-600" : "text-red-600"}`}>
                    {status}
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your name"
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                      required
                      className="h-12"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell me about your project..."
                    rows={6}
                    required
                  />
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full">
                  <Send className="w-5 h-5" />
                  Send Message
                </Button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-semibold mb-4 font-playfair">Let's Connect</h3>
                <p className="text-muted-foreground mb-8">
                  Prefer a more direct approach? Feel free to reach out through any of these channels.
                </p>
              </div>

              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <a
                    key={info.title}
                    href={info.href}
                    className="flex items-center space-x-4 p-4 bg-card border border-border rounded-xl hover:bg-muted/50 transition-all duration-300 group opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="p-3 bg-primary/10 text-primary rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <info.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{info.title}</h4>
                      <p className="text-muted-foreground">{info.value}</p>
                    </div>
                  </a>
                ))}
              </div>

              {/* Call to Action */}
              <div className="p-6 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl">
                <h4 className="font-semibold text-lg mb-2">Ready to Start?</h4>
                <p className="text-muted-foreground mb-4">
                  Let's schedule a call to discuss your project in detail and explore how we can bring your vision to life.
                </p>
                <Button variant="outline" className="w-full">
                  Schedule a Call
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;