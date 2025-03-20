import React, { useState } from 'react';
import IncomeTaxTable from '../../tables/payroll/IncomeTaxTable';
import FilterIncomeTax from '../../forms/payroll/FilterIncomeTax';
import PenstionFundTable from '../../tables/payroll/PenstionFundTable';

const PenstionFund = () => {
  const fnames = [
    'Abrham',
    'Halkano',
    'Markos',
    'Abebe',
    'Telahun',
    'Aserat',
    'Sleshi',
  ];
  const lnames = ['Tesfa', 'Mekonene', 'Aseffa', 'Mulu', 'Maru', 'Feleke'];
  const mnames = ['Bekele', 'Dawit', 'Haile', 'Melaku', 'Telahun', 'Amare'];
  
  const salaryData = ['4000', '5000', '4500', '7000'];

  const cities = [
    {
      name: 'Addis Ababa',
      subCities: [
        {
          name: 'Kirkos',
          weredas: ['Wereda 1', 'Wereda 2'],
        },
        {
          name: 'Lideta',
          weredas: ['Wereda 3', 'Wereda 4'],
        },
        {
          name: 'Bole',
          weredas: ['Wereda 5', 'Wereda 6'],
        },
      ],
    },
    {
      name: 'Gonder',
      subCities: [
        {
          name: 'Aynalem',
          weredas: ['Wereda 7', 'Wereda 8'],
        },
        {
          name: 'Agena',
          weredas: ['Wereda 9', 'Wereda 10'],
        },
        {
          name: 'Gore',
          weredas: ['Wereda 11', 'Wereda 12'],
        },
      ],
    },
    {
      name: 'Sidama',
      subCities: [
        {
          name: 'Hawassa',
          weredas: ['Wereda 13', 'Wereda 14'],
        },
        {
          name: 'Bensa',
          weredas: ['Wereda 15', 'Wereda 16'],
        },
      ],
    },
  ];

  const branchs = [
    {
      name: 'Addis Ababa Arada',
      department: [
        {
          name: 'IT',
          position: ['Software', 'IT'],
        },
        {
          name: 'Security',
          position: ['security', 'Shift Leader'],
        },
        {
          name: 'Marketing',
          position: ['Sales', 'Manager'],
        },
      ],
    },
    {
      name: 'Addis Ababa Saris',
      department: [
        {
          name: 'Security',
          position: ['security', 'shift leader'],
        },
      ],
    },
  ];

  const generateRandomEmployee = () => {
    // Pick a random city
  const randomCityIndex = Math.floor(Math.random() * cities.length);
  const randomCity = cities[randomCityIndex];

  // Pick a random subcity from the city 
  const randomSubcityIndex = Math.floor(Math.random() * randomCity.subCities.length);
  const randomSubcity = randomCity.subCities[randomSubcityIndex];

  // Pick a random wereda from the subcity
  const randomWeredaIndex = Math.floor(Math.random() * randomSubcity.weredas.length);  
  const randomWereda = randomSubcity.weredas[randomWeredaIndex];


   // Pick a random city
   const randomBranchIndex = Math.floor(Math.random() * branchs.length);
   const randomBranch = branchs[randomBranchIndex];
 
   // Pick a random subcity from the city 
   const randomDepIndex = Math.floor(Math.random() * randomBranch.department.length);
   const randomDep = randomBranch.department[randomDepIndex];
 
   // Pick a random wereda from the subcity
   const randomPositionIndex = Math.floor(Math.random() * randomDep.position.length);  
   const randomPosition = randomDep.position[randomPositionIndex];

    return {
      key: Math.random ().toString (),
      TIN: `00${Math.floor (Math.random () * 10000)}`,
      fullName: fnames[Math.floor (Math.random () * fnames.length)] +' '+ mnames[Math.floor (Math.random () * mnames.length)] +' '+ lnames[Math.floor (Math.random () * lnames.length)],
      hiredDate: `2016/${Math.floor (Math.random () * 10)+1}/${Math.floor (Math.random () * 10)+1}`,
      salary: salaryData[Math.floor (Math.random () * salaryData.length)],
      totalTransport: Math.floor (Math.random () * 100),
      totalTransportTax:Math.floor (Math.random () * 100),
      overTime: Math.floor (Math.random () * 10),
      taxableBenfits: Math.floor (Math.random () * 100),
      totalTaxableSalarys: Math.floor (Math.random () * 1000),
      incomeTax: Math.floor (Math.random () * 1000),
      costSharing: Math.floor (Math.random () * 100),
      netPayment: Math.floor (Math.random () * 15000),
    };
  };
  const [employees,setEmployees]=useState([])
  const getEmployeeData=()=>{
  const employee = Array (35).fill (0).map (generateRandomEmployee);
  setEmployees(employee)
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
      {/* <Descriptions
      title="Company Info"
        style={{width: '100%'}}
        column={{xs: 1, sm: 1}}
        bordered
        size="small"
        items={CompanyInfoData}
      />

      <Descriptions
        style={{width: '100%'}}
        column={{xs: 1, sm: 1}}
        bordered
        size="small"
        items={SummaryData}
      /> */}
      <FilterIncomeTax/>
      <PenstionFundTable penstionDate={[]} />
    </div>
  );
};

export default PenstionFund;
