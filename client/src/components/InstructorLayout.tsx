import { Link, useLocation } from 'wouter';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InstructorLayoutProps {
  children: ReactNode;
  title: string;
}

export default function InstructorLayout({ children, title }: InstructorLayoutProps) {
  const [location] = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/instructors-portal' },
    { name: 'Student Submissions', path: '/instructors-portal/submissions' },
    { name: 'Quiz Submissions', path: '/instructors-portal/quiz-submissions' },
    { name: 'Analytics', path: '/instructors-portal/analytics' },
    { name: 'Pop Quizzes', path: '/instructors-portal/quizzes' }
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="bg-card p-6 rounded-lg shadow-sm w-full md:w-1/5 border border-gray-800">
          <h2 className="text-xl font-bold mb-4 text-orange-500">Instructor Portal</h2>
          <nav>
            <ul className="space-y-2">
              {menuItems.map(item => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={cn(
                      "block px-4 py-2 rounded-md text-sm font-medium transition-colors",
                      location === item.path
                        ? "bg-orange-600 text-white"
                        : "text-foreground hover:bg-orange-600/20 hover:text-orange-500"
                    )}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="bg-card p-6 rounded-lg shadow-sm w-full md:w-4/5 border border-gray-800">
          <h1 className="text-2xl font-bold mb-6 text-foreground">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}