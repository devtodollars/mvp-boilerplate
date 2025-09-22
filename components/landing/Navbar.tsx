'use client';

import { useState, useEffect } from 'react';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList
} from '@/components/ui/navigation-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';

import { Button, buttonVariants } from '@/components/ui/button';
import { HouseIcon, Menu } from 'lucide-react';
import { ModeToggle } from './mode-toggle';
import { LogoIcon } from './Icons';
import { createApiClient } from '@/utils/supabase/api';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/providers/AuthProvider';
import NotificationBell from '@/components/NotificationBell';
import ChatNotificationBell from '@/components/ChatNotificationBell';
import { DashboardIcon } from '@radix-ui/react-icons';

interface RouteProps {
  href: string;
  label: string;
}

const routeList: RouteProps[] = [
  {
    href: '/#features',
    label: 'Features'
  },
  // {
  //   href: '/#testimonials',
  //   label: 'Testimonials'
  // },
  {
    href: '/#pricing',
    label: 'Pricing'
  },
  {
    href: '/#faq',
    label: 'FAQ'
  }
];

export const Navbar = () => {
  const router = useRouter();
  const { toast } = useToast();
  const api = createApiClient(createClient());
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const pathname = usePathname();
  const { user } = useAuth();

  // Handle window resize for better responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);
  const handleAuth = async () => {
    if (user) {
      return router.push('/dashboard');
    }
    return router.push('/auth');
  };

  const handleSignOut = async () => {
    try {
      await api.signOut();
      toast({
        title: 'Signed out successfully!'
      });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: 'Error signing out',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };
  return (
    <header className="sticky border-b-[1px] top-0 z-40 w-full bg-white dark:border-b-slate-700 dark:bg-background">
      <NavigationMenu className="mx-auto">
        <NavigationMenuList className="container h-14 px-4 w-screen flex justify-between ">
          <NavigationMenuItem className="font-bold flex items-center gap-6">
            <a
              rel="noreferrer noopener"
              href="/"
              className="ml-2 font-bold text-xl flex"
            >
              <LogoIcon />
              GoLet.ie
            </a>
            
            {/* Desktop navigation items next to logo */}
            {pathname === '/' && (
              <nav className="hidden md:flex gap-2">
                {routeList.map((route: RouteProps, i) => (
                  <a
                    rel="noreferrer noopener"
                    href={route.href}
                    key={i}
                    className={`text-[17px] ${buttonVariants({
                      variant: 'ghost'
                    })}`}
                  >
                    {route.label}
                  </a>
                ))}
              </nav>
            )}
          </NavigationMenuItem>

          {/* mobile */}
          <span className="flex md:hidden">
            {/* <ModeToggle /> */}

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger className="px-2" asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>

              <SheetContent side={'left'}>
                <SheetHeader>
                  <SheetTitle className="font-bold text-xl">
                    GoLet.ie
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col justify-center items-center gap-2 mt-4">
                  {pathname === '/' && (
                    <>
                      {routeList.map(({ href, label }: RouteProps) => (
                        <a
                          rel="noreferrer noopener"
                          key={label}
                          href={href}
                          onClick={() => setIsOpen(false)}
                          className={buttonVariants({ variant: 'ghost' })}
                        >
                          {label}
                        </a>
                      ))}
                    </>
                  )}
                  {user ? (
                    <div className="flex flex-col gap-2">
                      {/* Mobile Notifications */}
                      <div className="flex justify-center gap-2 mb-2">
                        <NotificationBell />
                        <ChatNotificationBell />
                        <Button
                        variant="ghost"
                        onClick={handleAuth}
                        className="justify-start"
                      >
                        <HouseIcon className="h-5 w-5 mr-2" />
                  
                      </Button>
                      </div>
                     
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSignOut}
                      >
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={handleAuth}
                    >
                      Sign In
                    </Button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </span>




          {/* {pathname === '/search' && (
            <div className="flex w-full max-w-lg items-center gap-2 justify-center lg:justify-start">
            <Input type="text" placeholder="room, address, etc." />
            <Button type="button" variant="ghost" >
              Search
            </Button>

            <Button type="button" variant="ghost">Filter</Button>

          </div>
          )} */}


          <div className="hidden md:flex gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <NotificationBell />
                <ChatNotificationBell />
                <Button
                  onClick={handleAuth}
                  variant="ghost"
                  size="sm"
                  className="relative"
                >
                  <HouseIcon className="h-5 w-5" />
                </Button>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleAuth}
                variant="ghost"
              >
                Sign In
              </Button>
            )}
            {/* <ModeToggle /> */}
          </div>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
};
