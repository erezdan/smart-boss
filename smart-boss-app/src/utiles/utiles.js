export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const getStatusColor = (status) => {
  switch (status) {
    case "scheduled":
      return "bg-orange-100 text-orange-800 border-orange-200"; // Scheduled - waiting for confirmation
    case "confirmed":
      return "bg-green-100 text-green-800 border-green-200"; // Approved
    case "delayed":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"; // Delayed
    case "enroute":
      return "bg-blue-100 text-blue-800 border-blue-200"; // In-flight
    case "landed":
      return "bg-gray-100 text-gray-800 border-gray-200"; // Landed / Completed
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200"; // Cancelled
    default:
      return "bg-gray-50 text-gray-600 border-gray-200"; // Fallback
  }
};
