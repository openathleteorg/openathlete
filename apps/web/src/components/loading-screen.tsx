interface P {
  message?: string;
}

export function LoadingScreen({ message }: P) {
  return (
    <div className="flex items-center justify-center h-screen flex-col">
      <div className="w-20 h-20 border-t-4 border-b-4 border-gray-900 dark:border-gray-100 rounded-full animate-spin" />
      {message && (
        <p className="mt-4 text-gray-900 dark:text-gray-100">{message}</p>
      )}
    </div>
  );
}
