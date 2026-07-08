import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext, CartContext } from '../App';
import { ShoppingCart, LogOut, Menu } from 'lucide-react';
import { fetchSiteConfig } from '../lib/siteConfig';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import CartDrawer from './CartDrawer';
import CommandPalette from './CommandPalette';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navigationItems, setNavigationItems] = useState([]);

  const handleLogin = () => {
    navigate('/login');
  };

  const fallbackNavLinks = [
    { id: 'home', label: 'Home', link: '/', enabled: true, show_desktop: true, show_mobile: true, show_footer: true, order: 1 },
    { id: 'personalize', label: 'Personalize', link: '/personalize', enabled: true, show_desktop: true, show_mobile: true, show_footer: true, featured: true, order: 2 },
    { id: 'shop', label: 'Shop', link: '/shop', enabled: true, show_desktop: true, show_mobile: true, show_footer: true, order: 3 },
    { id: 'design-your-own', label: 'Design Your Own', link: '/design-your-own', enabled: true, show_desktop: true, show_mobile: true, show_footer: true, featured: true, order: 4 },
    { id: 'corporate-bulk', label: 'Corporate & Bulk', link: '/corporate-bulk-orders', enabled: true, show_desktop: false, show_mobile: false, show_footer: false, footer_group: 'hidden', order: 5 },
    { id: 'about', label: 'About', link: '/about', enabled: true, show_desktop: true, show_mobile: true, show_footer: true, order: 6 },
    { id: 'contact', label: 'Contact', link: '/contact', enabled: true, show_desktop: true, show_mobile: true, show_footer: true, order: 7 },
  ];

  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        const data = await fetchSiteConfig();
        const items = data?.settings?.navigation_items || [];
        setNavigationItems(items.length > 0 ? items : fallbackNavLinks);
      } catch (error) {
        setNavigationItems(fallbackNavLinks);
      }
    };
    fetchNavigation();
  }, []);

  const navLinks = (navigationItems.length > 0 ? navigationItems : fallbackNavLinks)
    .filter((item) => item.enabled)
    .map((item) => (
      item.id === 'corporate-bulk' && item.link === '/corporate-bulk-orders'
        ? { ...item, show_desktop: false, show_mobile: false }
        : item
    ))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const renderNavLink = (link, className, onClick) => {
    const destination = link.link || '/';
    return destination.startsWith('http') || destination.includes('#') ? (
      <a key={link.id || link.label} href={destination} className={className} onClick={onClick}>
        {link.label}
      </a>
    ) : (
      <Link key={link.id || link.label} to={destination} className={className} onClick={onClick}>
        {link.label}
      </Link>
    );
  };

  return (
    <div className="sticky top-0 z-40 w-full">
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center group">
              <img 
                src="/printqueen-logo.png" 
                alt="Print Queen 3D" 
                className="h-12 w-auto transition-transform group-hover:scale-105"
              />
            </Link>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-2 flex-1 justify-center px-4">
              {navLinks.filter((link) => link.show_desktop !== false).map((link) => {
                const linkClass = `whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-all ${
                  link.featured
                    ? 'bg-white/70 text-gray-950 shadow-sm ring-1 ring-black/5'
                    : 'text-gray-700 hover:text-gray-950 hover:bg-white/70'
                }`;
                return renderNavLink(link, linkClass);
              })}
            </div>

            <div className="hidden md:flex items-center space-x-3">
              <div className="hidden xl:block w-56">
                <CommandPalette />
              </div>
              
              {/* Cart Drawer Trigger */}
              <CartDrawer>
                <button className="cart-icon-button group">
                  <ShoppingCart className="h-6 w-6 text-gray-700 group-hover:text-blue-600 transition-colors" />
                  {cart.length > 0 && (
                    <span className="cart-count-badge">
                      {cart.length}
                    </span>
                  )}
                </button>
              </CartDrawer>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 pl-2 pr-4 rounded-full hover:bg-gray-100">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-400 via-cyan-300 to-violet-500 flex items-center justify-center text-white font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => navigate('/orders')}>
                      My Orders
                    </DropdownMenuItem>
                    {user.is_admin && (
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        Admin Dashboard
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={handleLogin} className="btn-primary rounded-full px-6">
                  Sign In
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-4 md:hidden">
              <div className="md:hidden">
                  <CommandPalette />
              </div>
              
              <CartDrawer>
                <button className="cart-icon-button">
                  <ShoppingCart className="h-6 w-6 text-gray-700" />
                  {cart.length > 0 && (
                    <span className="cart-count-badge">
                      {cart.length}
                    </span>
                  )}
                </button>
              </CartDrawer>

              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]">
                  <SheetHeader>
                    <SheetTitle className="text-center">Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col items-center gap-4 mt-8 text-center">
                    {navLinks.filter((link) => link.show_mobile !== false).map((link) => {
                      const linkClass = `w-full rounded-full px-5 py-3 text-lg font-bold text-white bg-black hover:bg-gray-900 transition-colors ${
                        link.featured ? 'shadow-sm' : ''
                      }`;
                      return renderNavLink(link, linkClass, () => setMobileMenuOpen(false));
                    })}
                    {user ? (
                      <>
                        <Link
                          to="/orders"
                          className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          My Orders
                        </Link>
                        {user.is_admin && (
                          <Link
                          to="/admin"
                            className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Admin Dashboard
                          </Link>
                        )}
                        <Button 
                          onClick={() => {
                            logout();
                            setMobileMenuOpen(false);
                          }} 
                          variant="outline" 
                          className="justify-center mt-4"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleLogin} className="btn-primary w-full mt-4">
                        Sign In
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>
      
    </div>
  );
};

export default Navbar;
