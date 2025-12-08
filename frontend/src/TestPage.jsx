const TestPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">Test Page Working!</h1>
      <p className="text-lg text-gray-700">If you can see this, React is working correctly.</p>
      <div className="mt-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Debugging Info:</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>React is rendering</li>
          <li>Tailwind CSS is working</li>
          <li>Component imports are working</li>
        </ul>
      </div>
    </div>
  )
}

export default TestPage
