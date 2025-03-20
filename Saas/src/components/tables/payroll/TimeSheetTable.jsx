import React, {useRef, useState} from 'react';
import {Button, Input, Space, Table, Tag, Tooltip} from 'antd';
import {SearchOutlined} from '@ant-design/icons';
import {Link} from 'react-router-dom';

const TimeSheetTable = ({timesheetData, loading}) => {
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
      record[dataIndex]
        .toString ()
        .toLowerCase ()
        .includes (value.toLowerCase ()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: text => (searchedColumn === dataIndex ? searchText : text),
  });

  const columns = [
    {
      title: 'Employee Information',
      fixed: 'left',
      children: [
        {
          title: 'IDNO',
          dataIndex: 'IDNO',
          ...getColumnSearchProps ('IDNO'),
          width: '140px',
          key: 'IDNO',
          render: r => (
            <Tooltip title="View Detail">
              <Link to={`/employee/detail/${r}`}>
                {r}
              </Link>
            </Tooltip>
          ),
        },
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
        // {
        //   title: 'Work Information',
        //   children: [
        //     {
        //       title: 'Branch',
        //       dataIndex: 'branch',
        //       key: 'branch',
        //       width: '80px',
        //     },
        //     {
        //       title: 'Department',
        //       dataIndex: 'department',
        //       key: 'department',
        //       width: '100px',
        //     },
        //     {
        //       title: 'Position',
        //       dataIndex: 'position',
        //       key: 'position',
        //       width: '80px',
        //     },
        //   ],
        // },
      ],
    },
    {
      title: 'Working Hours',
      children: [
        {
          title: 'Regular Place',
          children: [
            {
              title: 'Day',
              dataIndex: 'regularPD',
              key: 'regularPD',
              width: '80px',
            },
            {
              title: 'Hour',
              dataIndex: 'regularPH',
              key: 'regularPH',
              width: '80px',
            },
            {
              title: 'Rate (ETB)',
              dataIndex: 'regularPHRate',
              key: 'regularPHRate',
              width: '120px',
            },
          ],
        },
        {
          title: '32 Over Time',
          children: [
            {
              title: '32 OT',
              dataIndex: 'OT32',
              key: 'OT32',
              width: '80px',
            },
            {
              title: 'Rate (ETB)',
              dataIndex: 'OT32Rate',
              key: 'OT32Rate',
              width: '120px',
            },
          ],
        },
        {
          title: 'Regular Place OT',
          children: [
            {
              title: 'Day',
              dataIndex: 'regularPOTD',
              key: 'regularPOTD',
              width: '80px',
            },
            {
              title: 'Hour',
              dataIndex: 'regularPOTH',
              key: 'regularPOTH',
              width: '80px',
            },
            {
              title: 'Rate (ETB)',
              dataIndex: 'regularPOTHRate',
              key: 'regularPOTHRate',
              width: '120px',
            },
          ],
        },
        {
          title: 'Total',
          children: [
            {
              title: 'Day',
              dataIndex: 'totalDays',
              key: 'totalDays',
              width: '80px',
            },
            {
              title: 'Hour',
              dataIndex: 'totalHours',
              key: 'totalHours',
              width: '80px',
            },
          ],
        },
      ],
    },
    {
      fixed: 'right',
      title: 'Total Salary',
      width: '140px',
      dataIndex: 'totalSalary',
      render:r=>`${r.toFixed(2)} ETB`,
      key: 'totalSalary',
    },
    {
      fixed: 'right',
      title: 'Status',
      width: '80px',
      key: 'status',
      render: r => (
        <Tag
          color={
            r.status === 'Pending'
              ? 'processing'
              : r.status === 'Approved' ? 'success' : 'volcano'
          }
        >
          {r.status}
        </Tag>
      ),
    },
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
    //   ),
    // },
  ];

  return (
    <Table
      size="small"
      columns={columns}
      bordered
      scroll={{
        x: 500,
      }}
      pagination={{
        defaultPageSize: 7,
        showSizeChanger: false,
      }}
      dataSource={timesheetData}
      loading={loading}
    />
  );
};
export default TimeSheetTable;
