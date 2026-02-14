import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="text-center animate-fade-in relative z-10">
        <p className="text-8xl font-bold tracking-tighter text-muted-foreground/10">404</p>
        <h1 className="text-xl font-semibold text-foreground mt-4">Page not found</h1>
        <p className="text-[14px] text-muted-foreground mt-2 max-w-xs mx-auto">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/" className="inline-block mt-6">
          <Button variant="outline" className="rounded-full h-10 px-5 text-[13px] font-medium border-border hover:bg-accent text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    </main>
  );
}
