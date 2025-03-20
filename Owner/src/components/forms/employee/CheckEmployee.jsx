import React, {useContext, useState} from 'react';
import axios from 'axios';
import {Descriptions, Input, Result, Spin, Tag} from 'antd';
import {TbUserSearch} from 'react-icons/tb'
import {AlertContext} from '../../../context/AlertContext';
import {BLACKLISTAPI} from '../../../helper/Urls';
import {FormatDay} from '../../../helper/FormateDay';

const CheckEmployee = () => {
  const {openNotification} = useContext (AlertContext);

  const [employeeData, setEmployeeData] = useState ([]);
  const [loading, setLoading] = useState (false);
  const [employeeIdNo, setEmployeeIdNo] = useState ('');

  const getEmployeeData = async () => {
    setLoading (true);
    setEmployeeData ([]);
    try {
      const res = await axios.get (
        `${BLACKLISTAPI}/employee/search?IdNo=${employeeIdNo}`
      );
      setLoading (false);
      openNotification ('Success', res.data.message, 3, 'green');
      setEmployeeData (res.data.employeeStatus);
      console.log (employeeData);
    } catch (error) {
      openNotification ('error', error.response.data.message, 3, 'red');
      setLoading (false);
    }
  };

  const employeeinfo = [
    {
      key: 'O',
      label: 'ID Number',
      children: employeeData && employeeData.idNumber,
    },
    {
      key: '1',
      label: 'First Name',
      children: employeeData && employeeData.firstName,
    },
    {
      key: '2',
      label: 'Last Name',
      children: employeeData && employeeData.lastName,
    },
    {
      key: '3',
      label: 'Gender',
      children: employeeData && employeeData.gender,
    },
    {
      key: '31',
      label: 'Phone',
      children: employeeData && employeeData.mobile,
    },
    {
      key: '4',
      label: 'Date of Birth',
      children: (
        <span>{FormatDay (employeeData && employeeData.dateOfBirth)}</span>
      ),
    },
    {
      key: '6',
      label: 'Total Reports',
      children: employeeData && employeeData.reports,
    },
    {
      key: '7',
      label: 'Guilty Count',
      children: employeeData && employeeData.guilty,
    },
    {
      key: '5',
      label: 'Status',
      children: (
        <Tag
          color={
            employeeData && employeeData.status === 'Innocent'
              ? 'success'
              : 'error'
          }
        >
          {employeeData && employeeData.status}
        </Tag>
      ),
    },
  ];

  return (
    <div
      style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}
    >
      <Input.Search
        size="middle"
        style={{width: '300px', margin: '20px 0'}}
        placeholder="Employee ID Number"
        loading={loading}
        enterButton='Search'
        onChange={e => setEmployeeIdNo (e.target.value)}
        onSearch={() => getEmployeeData ()}
      />

      {loading
        ? <Spin
            style={{height: '400px', display: 'flex', alignItems: 'center'}}
          />
        : employeeData.length !== 0
            ? <Descriptions
                size="small"
                style={{width: '500px'}}
                title="Employee Info"
                items={employeeinfo}
                layout="vertical"
                bordered
              />
            : employeeIdNo === ''
                ? <Result
                    title="Check Status"
                    icon={<TbUserSearch size={200}/>}
                    subTitle="Enter Employee Id Number"
                  />
                : <Result
                    status="404"
                    title="404"
                    subTitle="Sorry, the Id Number does not exist."
                  />}
    </div>
  );
};

export default CheckEmployee;
