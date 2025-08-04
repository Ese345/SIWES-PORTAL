"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui";
import {
  GraduationCap,
  BookOpen,
  UserCheck,
  ArrowRight,
  Shield,
  Building,
  Clock,
} from "lucide-react";
import { APP_ROUTES } from "@/constants";

export default function LandingPage() {
  const { user } = useAuth();

  const features = [
    {
      icon: <GraduationCap className="h-8 w-8 text-blue-600" />,
      title: "Student Management",
      description:
        "Comprehensive student profile management with logbook tracking and performance monitoring.",
    },
    {
      icon: <BookOpen className="h-8 w-8 text-green-600" />,
      title: "Digital Logbook",
      description:
        "Modern digital logbook system with image uploads and supervisor approval workflow.",
    },
    {
      icon: <UserCheck className="h-8 w-8 text-purple-600" />,
      title: "Supervisor Portal",
      description:
        "Dedicated portal for school and industry supervisors to monitor student progress.",
    },
    {
      icon: <Clock className="h-8 w-8 text-orange-600" />,
      title: "Attendance Tracking",
      description:
        "Real-time attendance management with automated reporting and analytics.",
    },
    {
      icon: <Shield className="h-8 w-8 text-red-600" />,
      title: "Secure Access",
      description:
        "Role-based access control with secure authentication and data protection.",
    },
    {
      icon: <Building className="h-8 w-8 text-indigo-600" />,
      title: "Industry Integration",
      description:
        "Seamless integration with industry partners for comprehensive SIWES management.",
    },
  ];

  const stats = [
    { label: "Students Enrolled", value: "500+" },
    { label: "Industry Partners", value: "150+" },
    { label: "School Supervisors", value: "50+" },
    { label: "Successful Placements", value: "95%" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">
                SIWES Portal
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link href={APP_ROUTES.DASHBOARD}>
                  <Button>Go to Dashboard</Button>
                </Link>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href={APP_ROUTES.AUTH.LOGIN}>
                    <Button variant="outline">Login</Button>
                  </Link>
                  <Link href={APP_ROUTES.AUTH.REGISTER}>
                    <Button>Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Student Industrial Work
            <span className="text-blue-600 block">Experience Scheme</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A comprehensive digital platform for managing SIWES programs,
            connecting students, supervisors, and industry partners in a
            seamless experience.
          </p>
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={APP_ROUTES.AUTH.REGISTER}>
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href={APP_ROUTES.AUTH.LOGIN}>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Login to Portal
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for SIWES Management
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform provides all the tools necessary for effective SIWES
              program management.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    {feature.icon}
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of students and supervisors already using our
            platform.
          </p>
          {!user && (
            <Link href={APP_ROUTES.AUTH.REGISTER}>
              <Button
                size="lg"
                variant="outline"
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                Create Your Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <GraduationCap className="h-8 w-8 text-blue-400" />
                <span className="text-xl font-bold">SIWES Portal</span>
              </div>
              <p className="text-gray-400 mb-4">
                Empowering student industrial work experience through modern
                technology and seamless collaboration between academia and
                industry.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href={APP_ROUTES.AUTH.LOGIN}
                    className="hover:text-white"
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    href={APP_ROUTES.AUTH.REGISTER}
                    className="hover:text-white"
                  >
                    Register
                  </Link>
                </li>
                <li>
                  <a href="#features" className="hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#help" className="hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#docs" className="hover:text-white">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-white">
                    Contact Support
                  </a>
                </li>
                <li>
                  <a href="#status" className="hover:text-white">
                    System Status
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 SIWES Portal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
