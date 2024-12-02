export const API_BASE_URL = 'https://habit-server-et3v.onrender.com';
export const API_BASE_URL_DEV = 'http://127.0.0.1:8000';

export async function handleApiResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'An error occurred');
  }
  return response.json();
} 