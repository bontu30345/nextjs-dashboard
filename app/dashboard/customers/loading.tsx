export default function Loading() {
  return (
    <div
      className="w-full animate-pulse"
      role="status"
      aria-label="Loading customers"
    >
      <div className="mb-8 h-8 w-40 rounded bg-gray-100" />
      <div className="h-10 w-full rounded-md bg-gray-100" />
      <div className="mt-6 rounded-md bg-gray-50 p-2">
        <div className="space-y-2 md:hidden">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-28 rounded-md bg-white p-4">
              <div className="h-5 w-36 rounded bg-gray-100" />
              <div className="mt-3 h-4 w-48 rounded bg-gray-100" />
              <div className="mt-5 h-4 w-full rounded bg-gray-100" />
            </div>
          ))}
        </div>
        <div className="hidden md:block">
          <div className="grid grid-cols-5 gap-4 border-b p-4">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="h-5 rounded bg-gray-100" />
            ))}
          </div>
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="grid grid-cols-5 gap-4 bg-white p-5">
              {Array.from({ length: 5 }, (_, cellIndex) => (
                <div key={cellIndex} className="h-5 rounded bg-gray-100" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
