import { DatabaseStatus } from './components/DatabaseStatus';

export default async function Home() {
  // Log DATABASE_URL for debugging
  console.log('DATABASE_URL:', process.env.DATABASE_URL);

  return (
    <div className="container">
      <h1>Welcome to StoryAuditor</h1>
      <p>Built with <strong>Next.js</strong> - The React Framework for Production</p>
      <p>Next.js provides a powerful foundation with server-side rendering, static generation, API routes, and built-in optimization. Combined with Prisma for seamless database access, you have everything you need to build modern web applications.</p>
      <p>Experience fast performance, excellent developer experience, and production-ready features out of the box.</p>
      <button className="button">Explore Next.js</button>
      
      <DatabaseStatus />
    </div>
  );
}

