// Redirect from /edit to the quiz list
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function EditQuizRedirect() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation("/instructors-portal/quizzes");
  }, [setLocation]);
  
  return null;
}