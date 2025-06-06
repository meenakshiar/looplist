export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "LoopList",
  description: "Social Streak Tracker for Micro-Habits",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Explore",
      href: "/explore",
    },
  ],
  navMenuItems: [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "My Loops",
      href: "/my-loops",
    },
    {
      label: "Explore",
      href: "/explore",
    },
    {
      label: "Settings",
      href: "/settings",
    },
    {
      label: "Logout",
      href: "/logout",
    },
  ],
  links: {
    github: "https://github.com/yourusername/looplist",
    twitter: "https://twitter.com/looplist",
    docs: "https://looplist.app/docs",
    getStarted: "/signup",
    dashboard: "/dashboard",
  },
};
