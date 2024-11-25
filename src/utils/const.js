export const akkiourl = "http://54.255.151.153:3001/api";
export const keypulseurl = "http://18.143.174.1:8000/api";
export const adminUrl="http://54.255.151.153:4500/api"
export function getFinalData(uniqueArr, isDate, length) {
  // Convert values to valid Date objects or numbers
  const parsedArr = uniqueArr?.map(val => {
    if (isDate) {
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date; // Return null for invalid dates
    }
    return !isNaN(val) ? Number(val) : null; // Convert valid numbers
  }).filter(val => val !== null); // Filter out invalid values

  // Sort the array
  const sortedArr = parsedArr?.sort((a, b) => a - b);

  const finalData = [];

  // Helper function to format dates
  const formatDate = date => {
    if (isDate) {
      const d = new Date(date);
      return d.toLocaleDateString('en-US'); // Use 'en-US' or any preferred locale
    }
    return date; // For numbers, return as is
  };

  // Calculate the size of each segment
  const segmentSize = Math.ceil(sortedArr?.length / length);

  // Iterate through the array to pick middle values in each segment
  for (let i = 0; i < length; i++) {
    const segmentStart = i * segmentSize;
    const segmentEnd = Math.min((i + 1) * segmentSize, sortedArr?.length);

    const segmentValues = sortedArr?.slice(segmentStart, segmentEnd);
    const middleIndex = Math.floor(segmentValues?.length / 2);
    const minValue = segmentValues[middleIndex]; // Pick middle value as the representative

    // Count occurrences in this segment range
    const countInRange = sortedArr?.filter(
      val => val >= segmentValues[0] && val <= segmentValues[segmentValues?.length - 1]
    ).length;

    finalData.push({
      value: isDate ? `${formatDate(minValue)}` : `${minValue}`, // Use formatted date or number
      count: countInRange // Count of items in this range
    });
  }

  return finalData;
}

