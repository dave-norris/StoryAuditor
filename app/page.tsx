import { AuthHeader } from './components/AuthHeader';

export default function Home() {
  return (
    <div className="container">
      <AuthHeader />

      <section style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          The Ultimate Manuscript Auditor for Authors
        </h2>
        <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2rem' }}>
          StoryAuditor helps you refine your manuscript with intelligent analysis and actionable feedback.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
          <FeatureCard
            icon="📝"
            title="Comprehensive Analysis"
            description="Get detailed feedback on structure, pacing, character development, and dialogue."
          />
          <FeatureCard
            icon="🎯"
            title="Plot & Story Arc"
            description="Analyze your plot structure, identify weak points, and strengthen your narrative flow."
          />
          <FeatureCard
            icon="👥"
            title="Character Development"
            description="Evaluate character consistency, arcs, and believability throughout your story."
          />
          <FeatureCard
            icon="✍️"
            title="Writing Style"
            description="Get insights on prose, tone, voice, and stylistic consistency."
          />
          <FeatureCard
            icon="🔍"
            title="Content Audit"
            description="Identify plot holes, inconsistencies, and pacing issues automatically."
          />
          <FeatureCard
            icon="📊"
            title="Detailed Reports"
            description="Receive comprehensive reports with actionable recommendations for improvement."
          />
        </div>
      </section>

      <section style={{ marginTop: '4rem', padding: '2rem', backgroundColor: '#f3f4f6', borderRadius: '8px', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Ready to Audit Your Manuscript?
        </h3>
        <p style={{ fontSize: '1rem', color: '#666', marginBottom: '2rem' }}>
          Sign up today and start getting professional feedback on your work.
        </p>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div style={{
      padding: '1.5rem',
      backgroundColor: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{icon}</div>
      <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{title}</h4>
      <p style={{ color: '#666', fontSize: '0.95rem' }}>{description}</p>
    </div>
  );
}
