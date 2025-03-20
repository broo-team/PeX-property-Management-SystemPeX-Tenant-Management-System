import React from 'react';
import NetPayTable from '../../tables/payroll/NetPayTable';

const NetPaymentTab = () => {
 
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
      <NetPayTable penstionDate={[]} />
    </div>
  );
};

export default NetPaymentTab;
