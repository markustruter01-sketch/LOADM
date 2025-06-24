function TestApp() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1f2937',
      color: 'white',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>Frontend Test</h1>
      <p>If you see this, React is working!</p>
      <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#374151', borderRadius: '0.5rem' }}>
        <p>Test complete - Frontend loading successfully</p>
      </div>
    </div>
  );
}

export default TestApp;