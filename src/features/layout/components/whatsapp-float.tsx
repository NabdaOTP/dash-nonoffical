"use client";

import { MessageCircle } from "lucide-react"; 

export default function WhatsAppFloat() {
  const phoneNumber = "905352682350"; 

  return (
    <a
      href={`https://wa.me/${phoneNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-14 start-2 md:-start-62 z-9999 flex items-center gap-3 group"
      aria-label="Chat on WhatsApp"
    >
        
      <div className="hidden md:flex items-center bg-white dark:bg-gray-800 shadow-xl px-5 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 translate-x-80 group-hover:translate-x-80 transition-all duration-300 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
          Hello, how we can help you?
        </span>
        <span className="text-xl ml-2">→</span>
      </div>

      <div className="w-14 h-14 bg-[#25D366] hover:bg-[#20ba5a] transition-all duration-200 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/30 hover:scale-110 active:scale-95">
        <svg 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8"
        >
          <path
            d="M16 3C8.82 3 3 8.82 3 16C3 18.69 3.79 21.21 5.15 23.35L3.14 29.14L9.08 27.17C11.13 28.36 13.49 29 16 29C23.18 29 29 23.18 29 16C29 8.82 23.18 3 16 3Z"
            fill="#25D366"
          />
          <path
            d="M16 5C9.92 5 5 9.92 5 16C5 18.39 5.72 20.62 6.97 22.5L5.5 27.5L10.62 26.07C12.43 27.17 14.14 27.77 16 28C22.08 28 27 23.08 27 17C27 10.92 22.08 5 16 5ZM22.59 20.5C22.35 21.17 21.22 21.77 20.63 21.85C19.53 22 18.62 21.77 16.82 21.08C13.34 19.67 11.13 16.14 10.96 15.91C10.79 15.68 9.64 14.17 9.64 12.6C9.64 11.03 10.45 10.28 10.78 9.92C11.11 9.56 11.5 9.47 11.73 9.47C11.96 9.47 12.19 9.47 12.39 9.48C12.62 9.49 12.92 9.39 13.21 10.07C13.51 10.77 14.21 12.34 14.29 12.51C14.37 12.68 14.43 12.88 14.31 13.11C13.71 14.31 13.06 14.24 13.46 14.91C14.86 17.26 16.29 18.02 18.33 19.04C18.69 19.23 18.89 19.2 19.09 18.97C19.29 18.74 19.96 17.95 20.19 17.59C20.42 17.23 20.65 17.29 20.98 17.41C21.31 17.53 22.88 18.3 23.24 18.49C23.6 18.68 23.83 18.77 23.91 18.91C24 19.17 24 19.83 22.59 20.5Z"
            fill="white"
          />
        </svg>
      </div>
    </a>
  );
}