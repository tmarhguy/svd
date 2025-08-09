"use client";

import { motion } from "framer-motion";
import { BookOpen, Calendar, Users, Award, ExternalLink, Quote } from "lucide-react";

interface Reference {
  id: string;
  authors: string;
  title: string;
  journal?: string;
  publisher?: string;
  year: number;
  volume?: string;
  pages?: string;
  doi?: string;
  url?: string;
  category: "foundational" | "computational" | "educational" | "modern";
  description?: string;
}

const references: Reference[] = [
  {
    id: "eckart-young-1936",
    authors: "C. Eckart & G. Young",
    title: "The approximation of one matrix by another of lower rank",
    journal: "Psychometrika",
    year: 1936,
    volume: "1",
    pages: "211-218",
    category: "foundational",
    description: "The seminal paper establishing the optimality of SVD for low-rank approximation"
  },
  {
    id: "golub-vanloan-2013",
    authors: "G. H. Golub & C. F. Van Loan",
    title: "Matrix Computations",
    publisher: "Johns Hopkins University Press",
    year: 2013,
    volume: "4th Edition",
    category: "computational",
    description: "Comprehensive textbook on numerical linear algebra and matrix algorithms"
  },
  {
    id: "trefethen-bau-1997",
    authors: "L. N. Trefethen & D. Bau",
    title: "Numerical Linear Algebra",
    publisher: "SIAM",
    year: 1997,
    category: "educational",
    description: "Excellent introduction to numerical methods in linear algebra"
  },
  {
    id: "halko-martinsson-tropp-2011",
    authors: "N. Halko, P.-G. Martinsson, J. A. Tropp",
    title: "Finding structure with randomness: Probabilistic algorithms for constructing approximate matrix decompositions",
    journal: "SIAM Review",
    year: 2011,
    volume: "53",
    pages: "217-288",
    category: "modern",
    description: "Foundational work on randomized algorithms for large-scale SVD"
  },
  {
    id: "austin-2019",
    authors: "D. Austin",
    title: "We recommend a singular value decomposition",
    journal: "AMS Feature Column",
    year: 2019,
    url: "https://www.ams.org/publicoutreach/feature-column/fcarc-svd",
    category: "educational",
    description: "Accessible introduction to SVD with geometric intuition"
  },
  {
    id: "strang-2016",
    authors: "G. Strang",
    title: "Introduction to Linear Algebra",
    publisher: "Wellesley-Cambridge Press",
    year: 2016,
    volume: "5th Edition",
    category: "educational",
    description: "Classic textbook with clear explanations of linear algebra concepts"
  }
];

const categoryInfo = {
  foundational: { name: "Foundational Papers", color: "from-red-500 to-orange-500", icon: Award },
  computational: { name: "Computational Methods", color: "from-blue-500 to-purple-500", icon: BookOpen },
  educational: { name: "Educational Resources", color: "from-green-500 to-blue-500", icon: Users },
  modern: { name: "Modern Algorithms", color: "from-purple-500 to-pink-500", icon: Calendar }
};

export default function ReferencesSection() {
  const groupedRefs = references.reduce((acc, ref) => {
    if (!acc[ref.category]) {
      acc[ref.category] = [];
    }
    acc[ref.category]!.push(ref);
    return acc;
  }, {} as Record<string, Reference[]>);

  return (
    <section className="mb-16">
      <div className="bg-gradient-to-br from-space-900 to-space-800 p-8 rounded-xl border border-space-700">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4 neon-text">References</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Key sources and foundational works that informed this project's development
          </p>
        </div>

        {/* References by Category */}
        <div className="space-y-8">
          {Object.entries(groupedRefs).map(([category, refs]) => {
            const categoryData = categoryInfo[category as keyof typeof categoryInfo];
            const Icon = categoryData.icon;
            
            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                {/* Category Header */}
                <div className="flex items-center space-x-3 mb-6">
                  <div className={`p-2 bg-gradient-to-r ${categoryData.color} rounded-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-200">{categoryData.name}</h3>
                </div>

                {/* References Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {refs.map((ref) => (
                    <motion.div
                      key={ref.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3 }}
                      className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600 hover:border-space-500 transition-all duration-300"
                    >
                      {/* Reference Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-400 mb-1">{ref.authors}</h4>
                          <p className="text-gray-300 text-sm leading-relaxed">{ref.title}</p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <div className="flex items-center space-x-1 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span>{ref.year}</span>
                          </div>
                          {ref.url && (
                            <a
                              href={ref.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Publication Details */}
                      <div className="space-y-1 mb-3">
                        {ref.journal && (
                          <p className="text-sm text-gray-400">
                            <span className="text-green-400">Journal:</span> {ref.journal}
                            {ref.volume && <span className="text-gray-500">, Vol. {ref.volume}</span>}
                            {ref.pages && <span className="text-gray-500">, pp. {ref.pages}</span>}
                          </p>
                        )}
                        {ref.publisher && (
                          <p className="text-sm text-gray-400">
                            <span className="text-purple-400">Publisher:</span> {ref.publisher}
                            {ref.volume && <span className="text-gray-500">, {ref.volume}</span>}
                          </p>
                        )}
                      </div>

                      {/* Description */}
                      {ref.description && (
                        <div className="flex items-start space-x-2">
                          <Quote className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-400 italic">{ref.description}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Additional Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12 bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600"
        >
          <h3 className="text-xl font-bold text-center mb-4 text-yellow-400">Additional Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
            <div className="text-center">
              <div className="font-semibold text-blue-400 mb-1">Online Courses</div>
              <p>MIT OpenCourseWare, Coursera Linear Algebra</p>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-400 mb-1">Interactive Tools</div>
              <p>3Blue1Brown Visualizations, GeoGebra</p>
            </div>
            <div className="text-center">
              <div className="font-semibold text-purple-400 mb-1">Software Libraries</div>
              <p>NumPy, SciPy, MATLAB, Julia</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


