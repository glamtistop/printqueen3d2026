import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext, CartContext } from '../App';
import { ShoppingCart, User, LogOut, Menu } from 'lucide-react';
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

  const handleLogin = () => {
    const redirectUrl = `${window.location.origin}/products`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <nav className="navbar sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
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

          {/* Center - Command Palette */}
          <div className="hidden md:flex flex-1 justify-center max-w-md mx-4">
            <CommandPalette />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/products" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Shop
            </Link>
            
            {/* Cart Drawer Trigger */}
            <CartDrawer>
              <button className="relative group p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ShoppingCart className="h-6 w-6 text-gray-700 group-hover:text-blue-600 transition-colors" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
                    {cart.length}
                  </span>
                )}
              </button>
            </CartDrawer>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 pl-2 pr-4 rounded-full hover:bg-gray-100">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
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
              <button className="relative p-2">
                <ShoppingCart className="h-6 w-6 text-gray-700" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
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
                  <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  <Link
                    to="/products"
                    className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Shop All Products
                  </Link>
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
                        className="justify-start mt-4"
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
  );
};

export default Navbar;
