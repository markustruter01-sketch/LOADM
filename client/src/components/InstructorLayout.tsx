import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { BookOpenText, UserCog, BarChart3, FolderCheck, BookOpen } from "lucide-react";

interface InstructorLayoutProps {
  children: ReactNode;
}

export default function InstructorLayout({ children }: InstructorLayoutProps) {
  const [location] = useLocation();

  const menuItems = [
    {
      name: "Overview",
      path: "/instructors-portal",
      icon: <BookOpenText className="h-5 w-5" />,
    },
    {
      name: "Scenarios",
      path: "/instructors-portal/scenarios",
      icon: <FolderCheck className="h-5 w-5" />,
    },
    {
      name: "Pop Quizzes",
      path: "/instructors-portal/quizzes",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      name: "Student Progress",
      path: "/instructors-portal/student-progress",
      icon: <BarChart3 className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-10rem)]">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-xl font-bold flex items-center">
            <UserCog className="mr-2 h-6 w-6 text-orange-500" />
            Instructor Portal
          </h1>
        </div>
      </div>

      <div className="bg-muted/30 border-b">
        <div className="container mx-auto overflow-x-auto">
          <nav className="flex space-x-1 p-2">
            {menuItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a
                  className={`flex items-center py-2 px-3 whitespace-nowrap rounded-md text-sm font-medium transition-colors ${
                    (location === item.path || 
                     (item.path !== "/instructors-portal" && location.startsWith(item.path)))
                      ? "bg-orange-500/10 text-orange-500"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.icon}
                  <span className="ml-2">{item.name}</span>
                </a>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <main className="flex-1 bg-background">
        {children}
      </main>
    </div>
  );
}