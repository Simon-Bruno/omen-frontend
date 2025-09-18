import React from 'react';
import Loader from './Loader';

const brandAnalysis: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Brand Summary Generation
            </h1>
            <p className="text-lg text-gray-600">
              We're analyzing your store to create a comprehensive brand summary.
            </p>
          </div>

          <Loader />
        </div>
      </div>
    </div>
  );
};

export default brandAnalysis;
