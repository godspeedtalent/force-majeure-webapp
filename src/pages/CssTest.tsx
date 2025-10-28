/**
 * Simple CSS Test Page
 * Used to verify Tailwind CSS is processing correctly
 */

export default function CssTest() {
  return (
    <div className="min-h-screen bg-red-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          CSS Test Page
        </h1>
        <p className="text-gray-700 mb-2">
          If you can see this with proper styling, Tailwind is working!
        </p>
        <ul className="list-disc list-inside text-sm">
          <li className="text-green-600">Red background: bg-red-500</li>
          <li className="text-blue-600">Blue text: text-blue-600</li>
          <li className="text-purple-600">White card: bg-white</li>
          <li className="text-yellow-600">Shadow: shadow-xl</li>
        </ul>
      </div>
    </div>
  );
}
