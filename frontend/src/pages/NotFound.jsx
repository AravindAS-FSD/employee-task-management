import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <Link to="/dashboard" className="link mt-4 inline-block">
        Back to dashboard
      </Link>
    </div>
  );
}
