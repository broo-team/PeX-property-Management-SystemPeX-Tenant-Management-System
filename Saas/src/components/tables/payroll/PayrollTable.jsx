import React, {useContext, useRef, useState} from 'react';
import {
  Badge,
  Button,
  DatePicker,
  Divider,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import {SearchOutlined} from '@ant-design/icons';
import {MdDelete, MdEdit, MdFilterAltOff} from 'react-icons/md';
import {AlertContext} from '../../../context/AlertContext';
import {BACKENDURL} from '../../../helper/Urls';
import axios from 'axios';
import {CSVLink} from 'react-csv';
import {FaFileCsv, FaFileExcel} from 'react-icons/fa6';
import {TbReload} from 'react-icons/tb';
import { FormatDay } from '../../../helper/FormateDay';
import { Link } from 'react-router-dom';

const PayrollTable = ({payrollData, loading, reload}) => {
  const {openNotification} = useContext (AlertContext);
  const [searchedColumn, setSearchedColumn] = useState ('');
  const [searchText, setSearchText] = useState ('');
  const searchInput = useRef (null);
  const [modalOpen, setModalOpen] = useState (false);
  const [modalContent, setModalContent] = useState ([]);
  const [deleteLoading, setDeleteLoading] = useState (false);

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm ();
    setSearchText (selectedKeys[0]);
    setSearchedColumn (dataIndex);
  };
  const handleReset = clearFilters => {
    clearFilters ();
    setSearchText ('');
  };

  const getColumnSearchProps = dataIndex => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close,
    }) => (
      <div
        style={{
          padding: 8,
        }}
        onKeyDown={e => e.stopPropagation ()}
      >
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e =>
            setSelectedKeys (e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch (selectedKeys, confirm, dataIndex)}
          style={{
            marginBottom: 8,
            display: 'block',
          }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch (selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{
              width: 90,
            }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset (clearFilters)}
            size="small"
            style={{
              width: 90,
            }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: filtered => (
      <SearchOutlined
        style={{
          color: filtered ? '#1677ff' : undefined,
        }}
      />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        .toString ()
        .toLowerCase ()
        .includes (value.toLowerCase ()),
    onFilterDropdownOpenChange: visible => {
      if (visible) {
        // setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: text => (searchedColumn === dataIndex ? searchText : text),
  });

  const [filteredInfo, setFilteredInfo] = useState ({});
  const [sortedInfo, setSortedInfo] = useState ({});

  const handleChange = (pagination, filters, sorter) => {
    console.log ('Various parameters', pagination, filters, sorter);
    setFilteredInfo (filters);
    setSortedInfo (sorter);
  };

  const clearAll = () => {
    setFilteredInfo ({});
    setSortedInfo ({});
  };

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

  const preDefined = [
    {
      title: 'NO',
      key: 'NO',
      fixed: 'left',
      render:(_,__,index)=>index+1,
      width: '40px',
    },
    {
      title: 'IDNO',
      dataIndex: 'IDNO',
      ...getColumnSearchProps ('IDNO'),
      fixed: 'left',
      render:r=><Link to={`/employee/detail/${r}`}>{r}</Link>,
      width: '140px',
      key: 'IDNO',
    },
    {
      title: 'Employee Information',
      children: [
        {
          title: 'Personal info',
          children: [
            {
              title: 'Full Name',
              children: [
                {
                  title: 'First',
                  dataIndex: 'fName',
                  ...getColumnSearchProps ('fName'),
                  width: '90px',
                  key: 'fName',
                },
                {
                  title: 'Middle',
                  dataIndex: 'mName',
                  ...getColumnSearchProps ('mName'),
                  width: '90px',
                  key: 'mName',
                },
                {
                  title: 'Last',
                  dataIndex: 'lName',
                  ...getColumnSearchProps ('lName'),
                  width: '90px',
                  key: 'lName',
                },
                ,
              ],
            },
            {
              title: 'Sex',
              dataIndex: 'sex',
              key: 'sex',
              width: '80px',
              filters: [
                {
                  text: 'Male',
                  value: 'Male',
                },
                {
                  text: 'Female',
                  value: 'Female',
                },
              ],
              filteredValue: filteredInfo.sex || null,
              onFilter: (value, record) => record.sex.includes (value),
            },
            {
              title: 'Date Of Birth',
              dataIndex: 'dateOfBirth',
              width: '150px',
              key: 'createdAt',
              render: r => <span>{FormatDay (r)}</span>,
            },
            {
              title: 'Branch',
              dataIndex: 'branch',
              key: 'branch',
              ...getColumnSearchProps ('branch'),
              width: '200px',
            },
            {
              title: 'Department',
              dataIndex: 'department',
              ...getColumnSearchProps ('department'),
              key: 'department',
              width: '200px',
            },
            {
              title: 'Position',
              dataIndex: 'position',
              ...getColumnSearchProps ('position'),
              key: 'position',
              width: '200px',
            },
          ],
        },
      ],
    },
    {
      title: 'Payment Info',
      children: [
        {
          title: 'Basic Salary',
          dataIndex: 'basicSalary',
          key: 'basicSalary',
          width: '80px',
        },
        {
          title: 'Salary',
          dataIndex: 'salary',
          key: 'salary',
          width: '120px',
        },
        {
          title: 'Total Earning',
          dataIndex: 'totalEarning',
          key: 'totalEarning',
          width: '120px',
        },
        {
          title: 'Gross Salary',
          dataIndex: 'grossSalary',
          key: 'grossSalary',
          width: '120px',
        },
        {
          title: 'Income Tax',
          dataIndex: 'incomeTax',
          key: 'incomeTax',
          width: '120px',
        },
        {
          title: 'PF 7%',
          dataIndex: 'employeePension',
          key: 'employeePension',
          width: '120px',
        },
        {
          title: 'PF 11%',
          dataIndex: 'employerPension',
          key: 'employerPension',
          width: '120px',
        },
        {
          title: 'PF 18%',
          render:r=>parseFloat(r.employerPension) + parseFloat(r.employeePension),
          width: '120px',
        },
        {
          title: 'Saving 2%',
          render:r=>0,
          width: '120px',
        },
        {
          title: 'Penality',
          render:r=>0,
          width: '120px',
        },
        {
          title: 'Loan',
          render:r=>0,
          width: '120px',
        },
        {
          title: 'Total Deduction',
          dataIndex: 'totalDeduction',
          key: 'totalDeduction',
          width: '120px',
        },
        {
          title: 'Net Salary',
          dataIndex: 'netSalary',
          key: 'netSalary',
          width: '120px',
        },
      ],
    },

    // {
    //   fixed: 'right',
    //   title: 'Status',
    //   width: '80px',
    //   key: 'status',
    //   render: r => (
    //     <Tag color={r.status === 'Pending' ? 'orange' : 'Green'}>
    //       {r.status}
    //     </Tag>
    //   ),
    // },
    // {
    //   title: 'Action',
    //   width: '165px',
    //   fixed: 'right',
    //   key: 'operation',
    //   render: r => (
    //     <Space
    //       style={{display: 'flex', alignItems: 'center', flexWrap: 'wrap'}}
    //     >
    //       <Button
    //         type="text"
    //         onClick={() => {
    //           setModalOpen (true);
    //           setModalContent (r.IDNO);
    //         }}
    //       >
    //         <MdEdit />
    //       </Button>
    //       <Popconfirm
    //         title="Are you sure, Delete user"
    //         onConfirm={() => DeleteUser (r.IDNO)}
    //       >
    //         <Button
    //           type="text"
    //           disabled={deleteLoading}
    //           loading={deleteLoading}
    //         >
    //           <MdDelete color="red" />
    //         </Button>
    //       </Popconfirm>
    //     </Space>
    // ),
    // },
  ];

  let dynamicColumns = [];
  let dynamicColumns2 = [];

  dynamicColumns.push ({
    title: 'Earning',
    children: [
      {
        title: 'test',
        dataIndex: 'test',
        width: '120px',
      },
      {
        title: 'test',
        dataIndex: 'test',
        width: '120px',
      },
    ],
  });

  dynamicColumns2.push ({
    title: 'Dductions',
    children: [
      {
        title: 'test',
        dataIndex: 'test',
        width: '120px',
      },
      {
        title: 'test',
        dataIndex: 'test',
        width: '120px',
      },
    ],
  });

  const columns = [...preDefined];
  // const columns = [...preDefined, ...dynamicColumns ,...dynamicColumns2];
  return (
    <div>
      <div
        style={{
          display: 'flex',
          width: '100%',
          justifyContent: 'space-between',
          marginBottom: '30px',
        }}
      >
        <div style={{display: 'flex', gap: '5px'}}>
          <CSVLink data={payrollData} filename={'payroll-detail-csv'}>
            <Button><FaFileCsv />CSV</Button>
          </CSVLink>
          <CSVLink data={payrollData} filename={'payroll-detail-csv'}>
            <Button><FaFileExcel />Excel</Button>
          </CSVLink>
        </div>
        <div style={{display: 'flex', gap: '5px'}}>
          <Button onClick={reload} type="primary"><TbReload />Refresh</Button>
          <Button onClick={clearAll}><MdFilterAltOff /> Clear filters</Button>
        </div>
      </div>
      <Table
        size="small"
        columns={columns}
        bordered
        scroll={{
          x: 500,
        }}
        pagination={{
          defaultPageSize: 10,
          position: 'topRight',
          showSizeChanger: false,
        }}
        summary={(pageData) => {
          let totalSalary = 0;
          let totalEarnings = 0;
          let totalGrossSalary = 0;
          let totalIncomeTax = 0;
          let totalDeduction = 0;
          let totalNetSalary = 0;
          let totalPenstion7 = 0;
          let totalPenstion11 = 0;
          let totalPenstion18 = 0;
      
          pageData.forEach((record) => {
            totalSalary += parseFloat(record.salary) || 0;
            totalEarnings += parseFloat(record.totalEarning) || 0;
            totalGrossSalary += parseFloat(record.grossSalary) || 0;
            totalIncomeTax += parseFloat(record.incomeTax) || 0;
            totalDeduction += parseFloat(record.totalDeduction) || 0;
            totalNetSalary += parseFloat(record.netSalary) || 0;
            totalPenstion7 += parseFloat(record.employeePension) || 0;
            totalPenstion11 += parseFloat(record.employerPension) || 0;
            totalPenstion18 += parseFloat(record.employerPension) +parseFloat(record.employeePension) || 0;
          });
      
          return (
            <Table.Summary.Row>
              <Table.Summary.Cell colSpan={11} align='center'>
                ድምር / Total
              </Table.Summary.Cell>
              <Table.Summary.Cell>{totalSalary.toFixed(2)} ETB</Table.Summary.Cell>
              <Table.Summary.Cell>{totalEarnings.toFixed(2)} ETB</Table.Summary.Cell>
              <Table.Summary.Cell>{totalGrossSalary.toFixed(2)} ETB</Table.Summary.Cell>
              <Table.Summary.Cell>{totalIncomeTax.toFixed(2)} ETB</Table.Summary.Cell>
              <Table.Summary.Cell>{totalPenstion7.toFixed(2)} ETB</Table.Summary.Cell>
              <Table.Summary.Cell>{totalPenstion11.toFixed(2)} ETB</Table.Summary.Cell>
              <Table.Summary.Cell>{totalPenstion18.toFixed(2)} ETB</Table.Summary.Cell>
              <Table.Summary.Cell>{0.00} ETB</Table.Summary.Cell>
              <Table.Summary.Cell>{0.00} ETB</Table.Summary.Cell>
              <Table.Summary.Cell>{0.00} ETB</Table.Summary.Cell>
              <Table.Summary.Cell>{totalDeduction.toFixed(2)} ETB</Table.Summary.Cell>
              <Table.Summary.Cell>{totalNetSalary.toFixed(2)} ETB</Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}

        dataSource={payrollData}
        loading={loading}
        onChange={handleChange}
      />
    </div>
  );
};
export default PayrollTable;
