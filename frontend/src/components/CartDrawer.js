import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext, AuthContext } from '../App';
import { ShoppingCart, Trash2, Package, Plus, Minus, X } from 'lucide-react';
import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from './ui/sheet';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { toast } from 'sonner';

const CartDrawer = ({ children }) => {
  const { cart, removeFromCart, updateCartQuantity } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    setIsOpen(false);
    if (!user) {
      toast.error('Please sign in to checkout');
      const redirectUrl = `${window.location.origin}/checkout`;
      window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    } else {
      navigate('/checkout');
    }
  };

  const handleStartShopping = () => {
    setIsOpen(false);
    navigate('/products');
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild onClick={() => setIsOpen(true)}>
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full">
        <SheetHeader className="space-y-2.5 pr-6">
          <SheetTitle className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Your Cart ({cart.length})
          </SheetTitle>
        </SheetHeader>
        
        <Separator className="my-4" />

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center">
              <Package className="h-12 w-12 text-gray-300" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-gray-900">Your cart is empty</h3>
              <p className="text-gray-500">Looks like you haven't added anything yet.</p>
            </div>
            <Button 
              onClick={handleStartShopping}
              className="btn-primary"
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-6">
                {cart.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="h-full w-full object-cover object-center"
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <h3 className="line-clamp-1">{item.name}</h3>
                          <p className="ml-4">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{item.category}</p>
                        {item.variant && (
                          <p className="mt-1 text-xs text-blue-600">
                            {Object.entries(item.variant).map(([key, value]) => `${key}: ${value}`).join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-1 items-end justify-between text-sm">
                        <div className="flex items-center border rounded-md">
                          <button
                            onClick={() => updateCartQuantity(index, item.quantity - 1)}
                            className="p-1 hover:bg-gray-100 rounded-l-md"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2 font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(index, item.quantity + 1)}
                            className="p-1 hover:bg-gray-100 rounded-r-md"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            removeFromCart(index);
                            toast.success('Item removed');
                          }}
                          className="font-medium text-red-600 hover:text-red-500 flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-4 pt-6">
              <Separator />
              <div className="space-y-1.5">
                <div className="flex justify-between text-base font-medium text-gray-900">
                  <p>Subtotal</p>
                  <p>${total.toFixed(2)}</p>
                </div>
                <p className="text-sm text-gray-500">Shipping and taxes calculated at checkout.</p>
              </div>
              <Button 
                className="w-full btn-primary py-6 text-lg" 
                onClick={handleCheckout}
              >
                Checkout
              </Button>
              <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                <p>
                  or{' '}
                  <button
                    type="button"
                    className="font-medium text-blue-600 hover:text-blue-500"
                    onClick={() => setIsOpen(false)}
                  >
                    Continue Shopping
                    <span aria-hidden="true"> &rarr;</span>
                  </button>
                </p>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
