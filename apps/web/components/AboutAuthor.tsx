"use client";

import { motion } from "framer-motion";
import { 
  GraduationCap, 
  Mail, 
  Globe, 
  Github, 
  Linkedin, 
  Instagram, 
  Twitter, 
  Code, 
  Award,
  Calendar,
  BookOpen,
  Zap,
  Target
} from "lucide-react";

interface SocialLink {
  name: string;
  url: string;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const socialLinks: SocialLink[] = [
  {
    name: "Email",
    url: "mailto:tmarhguy@seas.upenn.edu",
    icon: Mail,
    color: "text-red-500",
    description: "Get in Touch"
  },
  {
    name: "LinkedIn",
    url: "https://linkedin.com/in/tmarhguy",
    icon: Linkedin,
    color: "text-blue-500",
    description: "Professional Network"
  },
  {
    name: "GitHub",
    url: "https://github.com/tmarhguy/svd",
    icon: Github,
    color: "text-gray-400",
    description: "SVD Project Repository"
  },
  {
    name: "Portfolio",
    url: "https://tmarhguy.github.io/tmarhguy",
    icon: Globe,
    color: "text-green-500",
    description: "Personal Website"
  },
  {
    name: "Twitter",
    url: "https://twitter.com/marhguy_tyrone",
    icon: Twitter,
    color: "text-blue-400",
    description: "Follow on Twitter"
  },
  {
    name: "Instagram",
    url: "https://instagram.com/tmarhguy",
    icon: Instagram,
    color: "text-pink-500",
    description: "Social Media"
  }
];

export default function AboutAuthor() {
  return (
    <section className="mb-12">
      <div className="bg-gradient-to-br from-space-900 to-space-800 p-8 rounded-xl border border-space-700">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 neon-text">About the Author</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Meet the developer behind this SVD Image Compression project
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Author Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="flex items-start space-x-6 mb-6">
              <div className="w-80 h-62 rounded-xl overflow-hidden border-3 border-blue-500 shadow-xl flex-shrink-0">
                <img 
                  src="/me.jpg" 
                  alt="Tyrone Marhguy" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-white mb-2">Tyrone Marhguy</h3>
                <p className="text-gray-400 text-lg mb-4">Computer Engineering Student</p>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-400">Education</h4>
                      <p className="text-gray-300">Computer Engineering Class of 2028</p>
                      <p className="text-gray-400 text-sm">University of Pennsylvania</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-400">Contact</h4>
                      <a 
                        href="mailto:tmarhguy@seas.upenn.edu" 
                        className="text-gray-300 hover:text-white transition-colors"
                      >
                        tmarhguy@seas.upenn.edu
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-purple-400">Course</h4>
                      <p className="text-gray-300">MATH 3120 - Linear Algebra</p>
                      <p className="text-gray-400 text-sm">Final Project</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>



            <div className="bg-gradient-to-br from-space-800 to-space-700 p-4 rounded-xl border border-space-600">
              <h4 className="font-semibold text-yellow-400 mb-3 flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span>Project Highlights</span>
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Advanced SVD implementation with real-time compression</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Interactive web interface with live image processing</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Comprehensive educational content and visualizations</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Performance optimization and error handling</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Social Links & Additional Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-xl font-bold text-gray-200 mb-4 flex items-center space-x-2">
                <Globe className="w-5 h-5 text-blue-400" />
                <span>Connect & Explore</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {socialLinks.map((link, index) => (
                  <motion.a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="group bg-gradient-to-br from-space-800 to-space-700 p-4 rounded-xl border border-space-600 hover:border-space-500 transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg group-hover:scale-110 transition-transform duration-300`}>
                        <link.icon className={`w-5 h-5 ${link.color}`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-200 group-hover:text-white transition-colors">
                          {link.name}
                        </h4>
                        <p className="text-sm text-gray-400">{link.description}</p>
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-200 mb-4 flex items-center space-x-2">
                <Code className="w-5 h-5 text-green-400" />
                <span>Technical Skills</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gradient-to-br from-space-800 to-space-700 rounded-lg border border-space-600">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-semibold text-gray-300">Frontend</span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>• React/Next.js</div>
                    <div>• TypeScript</div>
                    <div>• Tailwind CSS</div>
                  </div>
                </div>
                
                <div className="p-3 bg-gradient-to-br from-space-800 to-space-700 rounded-lg border border-space-600">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-gray-300">Mathematics</span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>• Linear Algebra</div>
                    <div>• SVD Algorithms</div>
                    <div>• Numerical Methods</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 p-4 rounded-xl border border-green-500/30">
              <h4 className="font-semibold text-green-400 mb-3 flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Project Timeline</span>
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-300">Research & Planning</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-gray-300">SVD Implementation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-gray-300">Web Interface Development</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-gray-300">Documentation & Testing</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 text-center"
        >
          <div className="bg-gradient-to-br from-space-800 to-space-700 p-4 rounded-xl border border-space-600">
            <p className="text-gray-400 text-sm">
              This project demonstrates the practical application of Singular Value Decomposition 
              in image compression, combining mathematical theory with modern web technologies.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
