import React from 'react';
import { DispatchView } from '../dispatch/DispatchView';

export const OrdersView: React.FC = () => {
  return (
    <div className="space-y-6">
      <DispatchView initialTab="orders" hideTabs={true} />
    </div>
  );
};

export default OrdersView;
