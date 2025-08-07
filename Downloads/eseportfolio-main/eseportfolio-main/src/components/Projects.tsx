import { Button } from "@/components/ui/button";
import { ExternalLink, Github } from "lucide-react";

const Projects = () => {
  const projects = [
    {
      title: "E-Commerce Platform",
      description: "A full-stack e-commerce solution with React, Node.js, and Stripe integration. Features include user authentication, payment processing, and admin dashboard.",
      tags: ["React", "Node.js", "MongoDB", "Stripe"],
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop",
      liveUrl: "https://example.com",
      githubUrl: "https://github.com"
    },
    {
      title: "Task Management App",
      description: "A collaborative project management tool with real-time updates, drag-and-drop functionality, and team collaboration features.",
      tags: ["TypeScript", "Next.js", "PostgreSQL", "Socket.io"],
      image: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600&h=400&fit=crop",
      liveUrl: "https://example.com",
      githubUrl: "https://github.com"
    },
    {
      title: "Weather Dashboard",
      description: "A beautiful weather application with location-based forecasts, interactive maps, and detailed weather analytics.",
      tags: ["React", "API Integration", "Charts.js", "Tailwind"],
      image: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=600&h=400&fit=crop",
      liveUrl: "https://example.com",
      githubUrl: "https://github.com"
    },
    {
      title: "Social Media Dashboard",
      description: "An analytics dashboard for social media managers with data visualization, scheduling tools, and performance metrics.",
      tags: ["Vue.js", "Python", "Django", "Chart.js"],
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
      liveUrl: "https://example.com",
      githubUrl: "https://github.com"
    }
  ];

  return (
    <section id="projects" className="py-20 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6">
              Featured <span className="gradient-text">Projects</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto mb-8" />
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Here are some of my recent projects that showcase my skills and passion for creating innovative solutions.
            </p>
          </div>

          {/* Projects Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <div 
                key={project.title}
                className="group bg-card border border-border rounded-2xl overflow-hidden card-hover opacity-0 animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Project Image */}
                <div className="relative overflow-hidden">
                  <img 
                    src={project.image} 
                    alt={project.title}
                    className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Project Links Overlay */}
                  <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="p-2 bg-background/90 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-background/90 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                    >
                      <Github className="w-5 h-5" />
                    </a>
                  </div>
                </div>

                {/* Project Content */}
                <div className="p-6 space-y-4">
                  <h3 className="text-xl font-semibold font-playfair group-hover:text-primary transition-colors duration-300">
                    {project.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {project.description}
                  </p>

                  {/* Tech Stack Tags */}
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span 
                        key={tag}
                        className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full border border-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                        Live Demo
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1" asChild>
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                        <Github className="w-4 h-4" />
                        Code
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View More Button */}
          <div className="text-center mt-12">
            <Button variant="hero" size="lg">
              <Github className="w-5 h-5" />
              View All Projects on GitHub
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Projects;