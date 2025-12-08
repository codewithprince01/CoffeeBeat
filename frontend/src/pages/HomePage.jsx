import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'

export const HomePage = () => {
  const { isAuthenticated } = useAuth()
  
  console.log('HomePage rendering, isAuthenticated:', isAuthenticated)

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="relative bg-white dark:bg-black overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0">
  <img
    className="h-full w-full object-cover"
    src="/background_wallaper.jpg"  
    alt="Coffee shop background"
  />
  <div className="absolute inset-0 bg-gray-900 dark:bg-black opacity-60"></div>
</div>

        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white dark:text-gray-100 sm:text-5xl lg:text-6xl">
            Welcome to <span className="text-blue-400">Coffee Beat</span>
          </h1>
          <p className="mt-6 text-xl text-gray-500 dark:text-gray-900 max-w-3xl mx-auto">
            Experience the perfect blend of premium coffee, delicious food, and exceptional service. 
            Order online, book a table, or join our team.
          </p>
          <div className="mt-10 flex justify-center flex-wrap gap-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-10 py-3 bg-blue-600 dark:bg-gray-700 rounded-full text-white font-semibold hover:bg-blue-700 dark:hover:bg-gray-600 transition"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/menu"
                  className="px-10 py-3 bg-gray-800 dark:bg-gray-700 rounded-full text-white font-semibold hover:bg-black dark:hover:bg-gray-600 transition"
                >
                  View Menu
                </Link>
                <Link
                  to="/login"
                  className="px-10 py-3 bg-blue-600 dark:bg-gray-700 rounded-full text-white font-semibold hover:bg-blue-700 dark:hover:bg-gray-600 transition"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 dark:text-gray-400 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
              Everything you need for a perfect coffee experience
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-300 lg:mx-auto">
              From ordering online to managing your coffee shop, we've got you covered.
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-x-8 md:gap-y-10">
              {/* Feature 1 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Online Ordering</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Order your favorite coffee and food online with real-time order tracking.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Table Booking</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Reserve your table in advance and manage your bookings online.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Analytics Dashboard</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Track sales, manage inventory, and analyze business performance.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Role-Based Access</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Different dashboards for admin, chef, waiter, and customer roles.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Real-Time Updates</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Get instant notifications for order status and booking updates.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">24/7 Service</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Order anytime, anywhere with our always-available online platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block text-blue-200">Join Coffee Beat today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

export default HomePage
