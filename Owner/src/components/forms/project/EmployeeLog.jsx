import { Timeline } from 'antd'
import React from 'react'

const EmployeeLog = () => {
  return (
    <div style={{marginTop:'20px'}}>
      <Timeline
    items={[
      {children: 'On 2015-09-01 removed from project due to sth',},
      {children: 'On 2015-10-01 Assigned from project due to sth',},
      {children: 'On 2015-11-01 Swap from project due to sth',},
    ]}
  />
    </div>
  )
}

export default EmployeeLog