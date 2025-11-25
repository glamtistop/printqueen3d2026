import React from 'react';
import { motion } from 'framer-motion';

const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.99 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} // Custom ease for "OS" feel
      className="w-full min-h-screen"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
