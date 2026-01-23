import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

try {
  console.log('Starting React app...');
  const rootElement = document.getElementById("root");
  console.log('Root element found:', rootElement);
  
  if (!rootElement) {
    throw new Error('Root element not found!');
  }
  
  const root = createRoot(rootElement);
  console.log('React root created:', root);
  
  root.render(<App />);
  console.log('React app rendered successfully!');
} catch (error) {
  console.error('Error mounting React app:', error);
  // Fallback content
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 50px; text-align: center; color: red;">
        <h1>FarmIQ - Error Loading</h1>
        <p>There was an error loading the React app.</p>
        <p>Error: ${error.message}</p>
        <p>Please check the console for more details.</p>
      </div>
    `;
  }
}
