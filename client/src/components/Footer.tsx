import { Link } from "wouter";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="text-sm text-gray-500 mb-2 sm:mb-0">
            &copy; {new Date().getFullYear()} MeetingMind. All rights reserved.
          </div>
          <div className="flex items-center space-x-6">
            <Link href="/privacy-policy">
              <a className="text-sm text-gray-500 hover:text-primary">Privacy Policy</a>
            </Link>
            <Link href="/terms">
              <a className="text-sm text-gray-500 hover:text-primary">Terms of Service</a>
            </Link>
            <Link href="/help">
              <a className="text-sm text-gray-500 hover:text-primary">Help Center</a>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
