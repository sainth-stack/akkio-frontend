import axios from 'axios';

const YOUR_OPENAI_API_KEY = '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'; // Replace with your actual API key
const API_ENDPOINT = 'https://api.openai.com/v1/engines/davinci/completions';

export const generateResponse = async (prompt) => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${YOUR_OPENAI_API_KEY}`,
  };

  const data = {
    prompt,
    max_tokens: 80, // You can adjust this value to control the response length
  };

  try {
    const response = await axios.post(API_ENDPOINT, data, { headers });
    return response.data.choices[0].text;
  } catch (error) {
    console.error('Error making API call:', error);
    return null;
  }
};