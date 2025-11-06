import React from 'react';
import Lottie from 'lottie-react';
import ghostAnimation from '../assets/images/ghost.json';

const Dashboard = () => {
  const firstName = localStorage.getItem('first_name');

  return (
    <div className="flex-1 flex flex-col items-center justify-center h-screen bg-[#FAF9F5]">
      <div className="text-center flex flex-col items-center gap-6">
        <h1 className="text-5xl font-light text-[#3D3D3A] tracking-tight">
          Good afternoon, <span className="text-[#D97757]">{firstName}</span>.
        </h1>
        
        <p className="text-lg text-[#6B6B68] font-medium">
          Ready for preparing interview?
        </p>

        <div className="mt-8 w-64 h-64">
          <Lottie animationData={ghostAnimation} loop={true} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;