import React from 'react'
import Navbar from '../components/Navbar'

export const AboutPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="bg-white">
        {/* Header */}
        <div className="relative bg-gray-800 py-24 px-4 sm:px-6 lg:px-8">
          <div className="relative max-w-7xl mx-auto">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              About Coffee Beat
            </h1>
            <p className="mt-6 text-xl text-gray-500 dark:text-gray-900 max-w-3xl">
              We're passionate about serving exceptional coffee and creating memorable experiences for our customers.
            </p>
          </div>
        </div>

        {/* Story Section */}
        <div className="relative py-16 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
              <div className="relative lg:row-start-1">
                <img
                  className="w-full h-64 object-cover rounded-lg shadow-xl lg:aspect-auto lg:h-full"
                  src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                  alt="Coffee shop interior"
                />
              </div>
              <div className="mt-8 lg:mt-0">
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
                  Our Story
                </h2>
                <p className="mt-6 text-lg text-gray-500">
                  Founded in 2020, Coffee Beat started as a small dream to bring the finest coffee experience to our community.
                  What began as a humble coffee shop has grown into a comprehensive coffee management system that serves
                  thousands of customers daily.
                </p>
                <p className="mt-6 text-lg text-gray-500">
                  We believe that great coffee is more than just a beverage – it's an experience. From carefully selected
                  beans to expertly crafted drinks, every cup tells a story of passion and dedication.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">50+</h3>
                    <p className="text-gray-500">Coffee Varieties</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">1000+</h3>
                    <p className="text-gray-500">Happy Customers Daily</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">15+</h3>
                    <p className="text-gray-500">Expert Baristas</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">4.9★</h3>
                    <p className="text-gray-500">Customer Rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Our Values
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                The principles that guide everything we do
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 mx-auto bg-blue-100 rounded-full">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900">Quality First</h3>
                <p className="mt-2 text-base text-gray-500">
                  We source the finest beans and use the best brewing methods to ensure every cup is perfect.
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 mx-auto bg-blue-100 rounded-full">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900">Community Focused</h3>
                <p className="mt-2 text-base text-gray-500">
                  We're more than a coffee shop – we're a community hub where people connect and create memories.
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 mx-auto bg-blue-100 rounded-full">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900">Innovation Driven</h3>
                <p className="mt-2 text-base text-gray-500">
                  We constantly evolve our menu and services to bring you the best coffee experience possible.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Meet Our Team
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                The passionate people behind Coffee Beat
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <img
                  className="mx-auto h-32 w-32 rounded-full"
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80"
                  alt="Team member"
                />
                <h3 className="mt-6 text-lg font-medium text-gray-900">Sarah Johnson</h3>
                <p className="text-gray-500">Founder & CEO</p>
              </div>
              <div className="text-center">
                <img
                  className="mx-auto h-32 w-32 rounded-full"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80"
                  alt="Team member"
                />
                <h3 className="mt-6 text-lg font-medium text-gray-900">Mike Chen</h3>
                <p className="text-gray-500">Head Barista</p>
              </div>
              <div className="text-center">
                <img
                  className="mx-auto h-32 w-32 rounded-full"
                  src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80"
                  alt="Team member"
                />
                <h3 className="mt-6 text-lg font-medium text-gray-900">Emily Davis</h3>
                <p className="text-gray-500">Operations Manager</p>
              </div>
              <div className="text-center">
                <img
                  className="mx-auto h-32 w-32 rounded-full"
                  src="https://images.unsplash.com/photo-1500648767791-00dc994a43e4?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80"
                  alt="Team member"
                />
                <h3 className="mt-6 text-lg font-medium text-gray-900">James Wilson</h3>
                <p className="text-gray-500">Head Chef</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-blue-600">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Join the Coffee Beat Family
              </h2>
              <p className="mt-4 text-xl text-blue-200">
                Whether you're a customer or looking to join our team, we'd love to hear from you.
              </p>
              <div className="mt-8 flex justify-center space-x-4">
                <a
                  href="/menu"
                  className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 transition-colors"
                >
                  View Menu
                </a>
                <a
                  href="/register"
                  className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-700 hover:bg-blue-800 transition-colors"
                >
                  Join Team
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutPage
