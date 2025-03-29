"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // Import usePathname to get the current path

// Define the type for each navigation link
type NavLink = {
  name: string;
  href: string;
};

// Define the navigation links
const navLinks: NavLink[] = [
  { name: "Home", href: "/" },
  { name: "Users", href: "/pages/users" },
  { name: "Register", href: "/pages/register" },
  // { name: "Settings", href: "/pages/setting" },
];

export default function Nav() {
  // State to manage the mobile menu visibility
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Get the current pathname
  const pathname = usePathname();

  return (
    <nav className="bg-[rgba(31,41,55,0.65)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-16">
          <div className="flex items-center">
            <div className="ml-10 flex items-baseline space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                    pathname === link.href
                      ? "bg-black text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
