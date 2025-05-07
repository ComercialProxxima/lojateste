import { useState } from "react";
import { useLocation, Link } from "wouter";
import { MessageSquare } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

const Header = () => {
  const [location, navigate] = useLocation();
  
  // For a real app, this would come from a user context or auth provider
  const user = {
    displayName: "Jane Pro",
    initials: "JP"
  };

  return (
    <header className="bg-background border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <MessageSquare className="h-8 w-8 text-secondary" />
                <h1 className="ml-2 text-xl font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">MeetingMind</h1>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 text-sm focus:outline-none">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-white">
                      {user.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block font-medium">{user.displayName}</span>
                  <ChevronDown className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/account">
                    <a className="cursor-pointer">Your Profile</a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/privacy-settings">
                    <a className="cursor-pointer">Settings</a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
