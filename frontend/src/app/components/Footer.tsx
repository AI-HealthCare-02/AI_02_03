import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="mt-auto py-6 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-3 text-xs text-gray-400">
          <Link
            to="/terms"
            className="hover:text-gray-600 transition-colors"
          >
            이용약관
          </Link>
          <span>|</span>
          <Link
            to="/privacy"
            className="hover:text-gray-600 transition-colors"
          >
            개인정보 처리방침
          </Link>
        </div>
      </div>
    </footer>
  );
}
