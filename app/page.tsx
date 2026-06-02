import { AuthHeader } from './components/AuthHeader';
import { DatabaseStatus } from './components/DatabaseStatus';

export default function Home() {
  return (
    <div className="container">
      <AuthHeader />

      <p>Built with <strong>Next.js</strong> - The React Framework for Production</p>
      <p>Next.js provides a powerful foundation with server-side rendering, static generation, API routes, and built-in optimization. Combined with PostgreSQL for reliable data storage, you have everything you need to build modern web applications.</p>
      <p>Experience fast performance, excellent developer experience, and production-ready features out of the box.</p>
      <button className="button">Explore Next.js</button>
      
      <DatabaseStatus />
    </div>
  );
}
