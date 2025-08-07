import { Code, Palette, Rocket, Users } from "lucide-react";

const About = () => {
  const skills = [
    {
      icon: Code,
      title: "Frontend Development",
      description: "React, TypeScript, Next.js, Tailwind CSS",
      color: "text-primary"
    },
    
    {
      icon: Users,
      title: "Collaboration",
      description: "Agile, Git, Team Leadership, Mentoring",
      color: "text-accent"
    }
  ];

  return (
    <section id="about" className="py-20 relative">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6">
              About <span className="gradient-text">Me</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto mb-8" />
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground leading-relaxed">
                I'm a passionate frontend Engineer with over 2 years of experience 
                creating digital experiences that make a difference. I love the intersection 
                of design and technology, where beautiful interfaces meet robust functionality.
              </p>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                When I'm not coding, you'll find me exploring new technologies, 
                contributing to open-source projects. 
                I believe in writing clean, maintainable code and managing projects
                that are both intuitive and delightful.
              </p>

              <div className="flex flex-wrap gap-3 mt-8">
                {["JavaScript", "TypeScript", "React", "Node.js", "Python", "PostgreSQL"].map((tech) => (
                  <span 
                    key={tech} 
                    className="px-4 py-2 bg-card border border-border rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-all duration-300 cursor-default"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Skills Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {skills.map((skill, index) => (
                <div 
                  key={skill.title}
                  className="group p-6 bg-card border border-border rounded-2xl card-hover opacity-0 animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`p-3 rounded-xl bg-background ${skill.color}`}>
                      <skill.icon className="w-8 h-8" />
                    </div>
                    <h3 className="font-semibold text-lg">{skill.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {skill.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;