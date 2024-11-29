export const akkiourl = "http://54.255.151.153:3001/api";
export const keypulseurl = "http://18.143.174.1:8000/api";
export const adminUrl="http://54.255.151.153:4500/api"
// export const adminUrl="http://localhost:4500/api"
export function getFinalData(uniqueArr, isDate, length) {
  // Add early return if input array is empty or undefined
  if (!uniqueArr || uniqueArr.length === 0) {
    return [];
  }

  // Convert values to valid Date objects or numbers
  const parsedArr = uniqueArr?.map(val => {
    if (isDate) {
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date; // Return null for invalid dates
    }
    return !isNaN(val) ? Number(val) : null; // Convert valid numbers
  }).filter(val => val !== null); // Filter out invalid values

  // Sort the array and add safety check
  const sortedArr = parsedArr?.sort((a, b) => a - b);
  if (!sortedArr || sortedArr.length === 0) {
    return [];
  }

  const finalData = [];

  // Helper function to format dates
  const formatDate = date => {
    if (isDate) {
      const d = new Date(date);
      return d.toLocaleDateString('en-US'); // Use 'en-US' or any preferred locale
    }
    return date; // For numbers, return as is
  };

  // Calculate the size of each segment and ensure it's at least 1
  const segmentSize = Math.max(1, Math.ceil(sortedArr.length / length));
  
  // Adjust length if necessary to prevent empty segments
  const actualLength = Math.min(length, sortedArr.length);

  // Update the loop to use actualLength
  for (let i = 0; i < actualLength; i++) {
    const segmentStart = i * segmentSize;
    const segmentEnd = Math.min((i + 1) * segmentSize, sortedArr.length);

    const segmentValues = sortedArr.slice(segmentStart, segmentEnd);
    if (segmentValues.length === 0) continue;  // Skip empty segments

    const middleIndex = Math.floor(segmentValues.length / 2);
    const minValue = segmentValues[middleIndex];

    // Count occurrences in this segment range
    const countInRange = sortedArr.filter(
      val => val >= segmentValues[0] && val <= segmentValues[segmentValues.length - 1]
    ).length;

    finalData.push({
      value: isDate ? `${formatDate(minValue)}` : `${minValue}`,
      count: countInRange
    });
  }

  return finalData;
}

