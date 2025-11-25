import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from './ui/command';
import { 
  Search, 
  Package, 
  Home, 
  ShoppingBag, 
  User, 
  Settings, 
  LogOut,
  CreditCard
} from 'lucide-react';
import axios from 'axios';

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (open) {
      fetchProducts();
    }
  }, [open]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/products?limit=10`);
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products for command palette', error);
    }
  };

  const runCommand = (command) => {
    setOpen(false);
    command();
  };

  return (
    <>
      {/* Trigger Button (Visible on Desktop) */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors border border-gray-200"
      >
        <Search className="h-4 w-4" />
        <span className="hidden lg:inline">Search...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-gray-500 opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Mobile Trigger (Icon Only) */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 text-gray-500 hover:text-gray-900"
      >
        <Search className="h-5 w-5" />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Suggestions">
            <CommandItem onSelect={() => runCommand(() => navigate('/products'))}>
              <ShoppingBag className="mr-2 h-4 w-4" />
              <span>Shop All Products</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate('/orders'))}>
              <Package className="mr-2 h-4 w-4" />
              <span>My Orders</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Products">
            {products.map((product) => (
              <CommandItem 
                key={product.id} 
                onSelect={() => runCommand(() => navigate(`/products/${product.id}`))}
              >
                <Package className="mr-2 h-4 w-4" />
                <span>{product.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Settings">
            <CommandItem onSelect={() => runCommand(() => navigate('/profile'))}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate('/cart'))}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>View Cart</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default CommandPalette;
