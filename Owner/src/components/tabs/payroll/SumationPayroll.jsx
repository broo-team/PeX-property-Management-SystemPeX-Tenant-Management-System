import React from 'react'
import SumationTable from '../../tables/payroll/SumationTable'

const SumationPayroll = () => {
  const names = ['John', 'Jane', 'Mark'];
  const departments = ['HR', 'Sales', 'IT'];

  const generateRandomEmployee = () => {
    return {
      key: Math.random().toString(),
      IDNO: `EMP00${Math.floor(Math.random() * 100)}`,
      name: names[Math.floor(Math.random()*names.length)],
      branch: names[Math.floor(Math.random()*names.length)],
      department: departments[Math.floor(Math.random()*names.length)],
      position: names[Math.floor(Math.random()*names.length)],
      site: names[Math.floor(Math.random()*names.length)],
      city: names[Math.floor(Math.random()*names.length)],  
      subCity: names[Math.floor(Math.random()*names.length)],
      wereda: names[Math.floor(Math.random()*names.length)],
      basicSalary: Math.floor(Math.random() * 10000),
      earnings: {
        taxable: Math.floor(Math.random() * 1000),  
        nonTaxable: Math.floor(Math.random() * 200),
        total: Math.floor(Math.random() * 1200)
      },
      grossSalary: Math.floor(Math.random() * 20000),
      deductions: {
        incomeTax: Math.floor(Math.random() * 1000),
        PF7: Math.floor(Math.random() * 700),   
        PF11: Math.floor(Math.random() * 1100),
        loan: Math.floor(Math.random() * 500),
        penalty: Math.floor(Math.random() * 200),  
        total: Math.floor(Math.random() * 3500)
      },
      netSalary: Math.floor(Math.random() * 15000),
      status: ['Approved', 'Pending'][Math.floor(Math.random() * 2)]
    }
  }
  const employees = Array(35).fill(0).map(generateRandomEmployee)

  return (
    <SumationTable payrollDate={employees}/>
  )
}

export default SumationPayroll