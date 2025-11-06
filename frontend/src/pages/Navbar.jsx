import React, { useState } from 'react';
import Lottie from 'lottie-react';
import ghostAnimation from '../assets/images/ghost.json';

const Navbar = () => {
  const [isHovered, setIsHovered] = useState(false);
  const firstName = localStorage.getItem('first_name');

  return (
    <div className="flex justify-end items-center px-8 pt-2 bg-[#FAF9F5]">
      <div className="relative">
        <button
          className="w-12 right-5 fixed h-6 focus:outline-none"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Lottie className='w-8' animationData={ghostAnimation} loop={true} />
        </button>

        {/* Hover Tooltip */}
        {isHovered && (
          <div className="fixed right-20 top-8 w-72 bg-gray-900 text-white text-sm rounded-lg px-4 py-3 shadow-xl z-50">
            <p className="leading-relaxed">
              Hello <span className="font-semibold">{firstName}</span>, I am parakh.ai. I am here to help you crack interviews. Hope we work hard together! 🚀
            </p>
            {/* Arrow pointer */}
            <div className="absolute top-1/2 -right-2 w-0 h-0 border-l-4 border-t-2 border-b-2 border-l-gray-900 border-t-transparent border-b-transparent transform -translate-y-1/2"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;