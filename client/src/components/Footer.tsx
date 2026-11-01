import { Link } from "wouter";
import Logo from "./Logo";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-muted py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <Logo className="justify-center md:justify-start mb-3" />
            <p className="text-muted-foreground text-sm text-center md:text-left">
              <span className="text-white">LOADM</span><span className="text-primary">workflow</span> - Professional loadmaster documentation platform
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end">
            <div className="flex space-x-4 mb-4">
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <FaGithub className="text-xl" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <FaLinkedin className="text-xl" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <FaTwitter className="text-xl" />
              </a>
            </div>
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} Virtual Dynamics. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
