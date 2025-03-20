import React, {useRef, useState} from 'react';
import {
  Badge,
  Button,
  Input,
  Space,
  Table,
  Tooltip,
} from 'antd';
import {SearchOutlined} from '@ant-design/icons';
import {FaFileCsv} from 'react-icons/fa6';
import { MdFilterAltOff, MdList, MdSwapHoriz} from 'react-icons/md';
import {CSVLink} from 'react-csv';
import {FormatDay} from '../../../helper/FormateDay';
import { Link } from 'react-router-dom';
import ModalForm from '../../../modal/Modal';
import RemoveEmployee from '../../forms/project/RemoveEmployee';
import SwapEmployee from '../../forms/project/SwapEmployee';
import EmployeeLog from '../../forms/project/EmployeeLog';

const EmployeeProjectTable = ({userData, loading, reload}) => {
  const [searchedColumn, setSearchedColumn] = useState ('');
  const [searchText, setSearchText] = useState ('');
  const searchInput = useRef (null);

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
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        searchText
      ) : (
        text
      ),
  });

  const [filteredInfo, setFilteredInfo] = useState({});
  const [filteredData, setFilteredData] = useState(userData);
  
  const handleChange = (pagination, filters) => {

    let filteredInfo = filters;
    let filterData = userData;
    setFilteredInfo(filters);
  
    Object.keys(filteredInfo).forEach(key => {
  
      const value = filteredInfo[key];
  
      if(!value) return;
      
      filterData = filterData.filter(item => {  
        return value.includes(item[key]); 
      });
  
    });
  
    setFilteredData(filterData);

  };

  const clearAll = () => {
    setFilteredInfo({});
    setFilteredData(userData);
  };
  
  const [modalOpen, setModalOpen] = useState (false);
  const [modalTitle, setModalTitle] = useState ('');
  const [modalContent, setModalContent] = useState ([]);

  const columns = [
    {
      title: 'IDNO',
      dataIndex: 'IDNO',
      ...getColumnSearchProps ('IDNO'),
      width: '120px',
      fixed:'left',
      render:r=><Link to={`/employee/detail/${r}`}>{r}</Link>,
      key: 'IDNO',
    },
    {
      title: 'Employee Info',
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
          onFilter: (value, record) => record.sex.includes(value),
        },
      ],
    },
    {
      title: 'Work Info',
      children: [
        {
          title: 'Role',
          dataIndex: 'role',
          width: '100px',
          key: 'role',
          filters: [
            {
              text: 'Arada Adwa',
              value: 'Arada Adwa',
            },
          ],
          filteredValue: filteredInfo.branch || null,
          onFilter: (value, record) => record.branch.includes(value),
        },
        {
          title: 'Position',
          dataIndex: 'position',
          width: '100px',
          key: 'position',
          filters: [
            {
              text: 'Security Guard',
              value: 'Security Guard',
            },
          ],
          filteredValue: filteredInfo.position || null,
          onFilter: (value, record) => record.position.includes(value),
        },
      ],
    },
    {
      title: 'Assign Date',
      dataIndex: 'assignedAt',
      width: '150px',
      key: 'assignedAt',
      render: r => <span>{FormatDay(r)}</span>,
    },
    {
      fixed: 'right',
      title: 'Status',
      width: '80px',
      key: 'status',
      filters: [
        {
          text: 'Active',
          value: 'Active',
        },
        {
          text: 'InActive',
          value: 'InActive',
        },
      ],
      filteredValue: filteredInfo.status || null,
      onFilter: (value, record) => record.status.includes(value),
      render: r => (
        <Badge
          status={r.status === 'Active' ? 'success' : 'error'}
          text={r.status}
        />
      ),
    },
    {
      title: 'Action',
      width: '200px',
      fixed: 'right',
      key: 'operation',
      render: r => (
          <Space>
            <Button 
            onClick={()=>{
              setModalContent(<RemoveEmployee
                id={r.IDNO}
                reload={() => reload ()}
                openModalFun={e => setModalOpen (e)}
              />)
              ;
              setModalOpen(true);
              setModalTitle(`Remove Employee ${r.IDNO}`);
            }}
            >Remove</Button>
            <Button
            onClick={()=>{
              setModalContent(<SwapEmployee
                reload={() => reload ()}
                openModalFun={e => setModalOpen (e)}
              />)
              ;
              setModalOpen(true);
              setModalTitle(`Swap Employee ${r.IDNO}`);
            }}
            ><MdSwapHoriz size={25}/></Button>
            <Tooltip title='view log' trigger='hover'>
            <Button
            onClick={()=>{
              setModalContent(<EmployeeLog
                reload={() => reload ()}
                openModalFun={e => setModalOpen (e)}
              />)
              ;
              setModalOpen(true);
              setModalTitle(`Employee ${r.IDNO} Log`);
            }}
            ><MdList/></Button>
              </Tooltip>
          </Space>
      ),
    },
  ];


  return (
    <div>
      <ModalForm
        open={modalOpen}
        close={() => setModalOpen (false)}
        title={modalTitle}
        content={modalContent}
      />
      <div style={{display:'flex',width:"100%",gap:'5px',marginBottom:"5px",justifyContent:'flex-end'}}>
      <Button onClick={reload} loading={loading} type='primary'>Reload</Button>
      <CSVLink
        data={filteredData}
        filename={"employee-detail-csv"}>
          <Button><FaFileCsv color='green'/>CSV</Button>
      </CSVLink>
      <Button onClick={clearAll}><MdFilterAltOff/> Clear filters</Button>
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
        showSizeChanger: true,
      }}
      dataSource={userData}
      onChange={handleChange}
      loading={loading}
    />
    </div>
  );
};
export default EmployeeProjectTable;