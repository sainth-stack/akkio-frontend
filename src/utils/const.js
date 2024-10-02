export const akkiourl="http://54.179.220.21:3001/api"
export const keypulseurl="http://18.143.174.1:8000/api"

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
  const sortedArr = parsedArr?.sort((a, b) => a - b); // Sorting works for both dates and numbers in JavaScript

  // Make chunk size dynamic based on the 'length' argument
  const chunkSize = Math.floor(sortedArr?.length / length); // Base size for each chunk
  const remainder = sortedArr?.length % length; // Handle remainder that cannot be evenly divided into 'length'

  const finalData = [];
  let index = 0;

  for (let i = 0; i < length; i++) {
    // Each chunk takes an extra item if there are remaining items from the division
    const currentChunkSize = i < remainder ? chunkSize + 1 : chunkSize;

    // Get the current chunk
    const chunk = sortedArr?.slice(index, index + currentChunkSize);

    if (chunk?.length > 0) {
      const minValue = chunk[0]; // First value (min) in sorted chunk
      const nextChunk = sortedArr?.slice(index + currentChunkSize); // Look ahead to the next chunk
      const nextMinValue = nextChunk?.length > 0 ? nextChunk[0] : chunk[chunk?.length - 1]; // Avoid duplicates by always taking the next distinct value

      // Format dates properly if isDate is true
      const formatDate = date => {
        if (isDate) {
          const d = new Date(date);
          return d.toLocaleDateString('en-US'); // Use 'en-US' or any preferred locale
        }
        return date; // For numbers, return as is
      };

      // Ensure there's no duplicate label by checking if the nextMinValue is greater than the current minValue
      const countInRange = sortedArr?.filter(val => val >= minValue && val < nextMinValue).length;

      finalData.push({
        value: isDate ? `${formatDate(minValue)}` : `${minValue}`, // Use formatted date or number
        count: countInRange // Count of items between minValue and nextMinValue
      });
    }

    index += currentChunkSize; // Move the index forward
  }

  return finalData;
}







  