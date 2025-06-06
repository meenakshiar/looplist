'use client';

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
} from "@heroui/navbar";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from "@heroui/dropdown";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/slices/authSlice";

import { ThemeSwitch } from "@/components/theme-switch";
import { Logo } from "@/components/icons";

export const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <HeroUINavbar maxWidth="xl" position="sticky" className="h-14">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-2 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <Logo size={24} />
            <p className="font-bold text-inherit">LoopList</p>
          </NextLink>
        </NavbarBrand>

        {isAuthenticated && (
          <>
            <NavbarItem>
              <NextLink
                href="/dashboard"
                className="text-sm font-medium text-default-600 hover:text-primary"
              >
                Dashboard
              </NextLink>
            </NavbarItem>
            <NavbarItem>
              <NextLink
                href="/explore"
                className="text-sm font-medium text-default-600 hover:text-primary"
              >
                Explore
              </NextLink>
            </NavbarItem>
          </>
        )}
      </NavbarContent>

      <NavbarContent className="basis-1/5 sm:basis-full" justify="end">
        <ThemeSwitch />

        {isAuthenticated ? (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                className="p-0 bg-transparent"
                radius="full"
                variant="light"
              >
                <Avatar
                  size="sm"
                  name={user?.email?.charAt(0).toUpperCase() || "U"}
                  showFallback
                  className="transition-transform cursor-pointer"
                />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile actions">
              <DropdownItem key="profile" textValue="Profile">
                <div className="font-semibold">Signed in as</div>
                <div className="text-sm text-default-500">{user?.email}</div>
              </DropdownItem>
              <DropdownItem key="settings" textValue="Settings">
                <NextLink href="/settings" className="w-full">
                  Settings
                </NextLink>
              </DropdownItem>
              <DropdownItem key="logout" className="text-danger" color="danger" onPress={handleLogout} textValue="Logout">
                Sign Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <NavbarItem>
            <Button
              as={NextLink}
              color="primary"
              href="/"
              variant="flat"
              radius="full"
              className="font-medium"
              size="sm"
            >
              Sign In
            </Button>
          </NavbarItem>
        )}
      </NavbarContent>
    </HeroUINavbar>
  );
};
