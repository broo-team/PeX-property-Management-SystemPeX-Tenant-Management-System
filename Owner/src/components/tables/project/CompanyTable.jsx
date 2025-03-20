import React, {useRef, useState} from 'react';
import {Table, Image, Button, Space, Input} from 'antd';
import {BACKENDURL} from '../../../helper/Urls';
import {SearchOutlined} from '@ant-design/icons';

const CompanyTable = ({loading, companyData}) => {
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
    render: text => (searchedColumn === dataIndex ? text : text),
  });

  const columns = [
    {
      title: 'Company Info',
      children: [
        {
          title: 'Name',
          dataIndex: 'name',
          key: 'name',
          ...getColumnSearchProps ('name'),
          width: '300px',
        },
        {
          title: 'TIN',
          dataIndex: 'TIN',
          ...getColumnSearchProps ('TIN'),
          width: '100px',
          key: 'TIN',
        },
        {
          title: 'VAT',
          dataIndex: 'VAT',
          ...getColumnSearchProps ('VAT'),
          width: '100px',
          key: 'VAT',
        },
        {
          title: 'Phone',
          dataIndex: 'phone',
          ...getColumnSearchProps ('phone'),
          width: '200px',
          key: 'phone',
        },
        {
          title: 'Email',
          dataIndex: 'email',
          width: '200px',
          key: 'email',
        },
      ],
    },
    {
      title: 'Company Address',
      children: [
        {
          title: 'City',
          key: 'city',
          width: '200px',
          dataIndex: 'city',
          ...getColumnSearchProps ('city'),
        },
        {
          title: 'Sub City',
          key: 'subCity',
          width: '200px',
          dataIndex: 'subCity',
          ...getColumnSearchProps ('subCity'),
        },
        {
          title: 'Wereda',
          key: 'wereda',
          width: '100px',
          dataIndex: 'wereda',
        },
        {
          title: 'Kebele',
          width: '100px',
          key: 'kebele',
          dataIndex: 'kebele',
        },
        {
          title: 'House No',
          width: '100px',
          key: 'houseNo',
          dataIndex: 'houseNo',
        },
      ],
    },
    {
      title: 'Sites',
      dataIndex: 'sites',
      width: '100px',
      key: 'sites',
    },
    {
      title: 'Employees',
      dataIndex: 'employees',
      width: '100px',
      key: 'employees',
    },
    {
      title: 'Agreement',
      dataIndex: 'agreement',
      width: '100px',
      key: 'agreement',
      render: r =>
        r
          ? <a
          target='_blank'
          href={`${BACKENDURL}/uploads/new/${r}`}
          >View</a>
          : 'None',
    },
    {
      title: 'License',
      dataIndex: 'license',
      width: '100px',
      key: 'license',
      render: r =>
        r
          ? <Image
              width={30}
              height={30}
              src={`${BACKENDURL}/uploads/new/${r}`}
            />
          : 'None',
    },
    {
      title: 'Profile',
      dataIndex: 'profile',
      key: 'profile',
      width: '100px',
      render: r =>
        r
          ? <Image
              width={30}
              height={30}
              src={`${BACKENDURL}/uploads/new/${r}`}
            />
          : 'None',
    },
  ];

  return (
    <Table
      columns={columns}
      size="small"
      dataSource={companyData}
      loading={loading}
      scroll={{
        x: 500,
      }}
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
      }}
    />
  );
};

export default CompanyTable;
