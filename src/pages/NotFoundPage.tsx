import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-muted px-4 text-center">
      <span className="text-6xl font-extrabold text-primary">404</span>
      <h1 className="text-xl font-bold text-ink">Page not found</h1>
      <p className="max-w-sm text-sm text-graytext">The page you're looking for doesn't exist or may have moved.</p>
      <Link to="/login">
        <Button className="mt-2">Back to login</Button>
      </Link>
    </div>
  );
}
