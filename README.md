# Financial Comparison Platform

A platform for comparing various financial products and services.

## Local Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd financial-comparison-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following content:
```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ranFoeWRic29jbWFxbWR6b2ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNDQ1NTUsImV4cCI6MjA1NzYyMDU1NX0.H0oxdLwxmd0nwwHcOLfiJDZdYJXG4ke6-q4n7W26aDU
VITE_SUPABASE_URL=https://nkjqhydbsocmaqmdzofg.supabase.co
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Features

- Compare car insurance rates
- Compare bank account fees
- Compare mortgage rates
- Compare cell phone plans
- Compare home insurance rates
- Compare internet & cable plans
- Compare real estate broker commissions

## Technologies Used

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase