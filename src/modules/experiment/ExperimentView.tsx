import React from 'react';
import { DispatchView } from '../dispatch/DispatchView';

export const ExperimentView: React.FC = () => {
  return <DispatchView initialTab="create_slip" hideTabs={false} hideHeader={false} />;
};

export default ExperimentView;
