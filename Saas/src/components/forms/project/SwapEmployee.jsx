import {Button, Divider, Form, Input, Select} from 'antd';
import axios from 'axios';
import React, {useContext, useEffect, useState} from 'react';
import {AlertContext} from '../../../context/AlertContext';
import {BACKENDURL} from '../../../helper/Urls';
import TextArea from 'antd/es/input/TextArea';
import Dragger from 'antd/es/upload/Dragger';
import { FaUpload } from 'react-icons/fa6';

const SwapEmployee = ({openModalFun, reload, projectId,empId}) => {
  const {openNotification} = useContext (AlertContext);
  const [loading, setLoading] = useState (false);
  const [form] = Form.useForm ();

  const [branchData, setBranchData] = useState ([]);
  const [branchId, setBranchId] = useState ('');
  const [loadingBranch, setLoadingBranch] = useState (false);

  const [departmentData, setDepartmentData] = useState ([]);
  const [departmentId, setDepartmentId] = useState ();
  const [loadingDepartment, setLoadingDepartment] = useState (false);

  const [positionData, setPositionData] = useState ([]);
  const [positionId, setPositionId] = useState ();
  const [loadingPosition, setLoadingPosition] = useState (false);

  const [employeeData, setEmployeeData] = useState ([]);
  const [loadingEmployee, setLoadingEmployee] = useState (false);
  const [attachment, setattachment] = useState ('none');

  const getBranchData = async () => {
    setLoadingBranch (true);
    try {
      const res = await axios.get (`${BACKENDURL}/organzation/branch/all`);
      setLoadingBranch (false);
      setBranchData (res.data.branchs);
    } catch (error) {
      openNotification ('error', error.response.data.message, 3, 'red');
      setLoadingBranch (false);
    }
  };

  const branchOptions = branchData
    ? branchData.map (branch => ({
        value: branch.id,
        label: branch.name,
      }))
    : [];

  useEffect (() => {
    getBranchData ();
  }, []);

  //employee

  const getEmployeeData = async id => {
    setLoadingEmployee (true);
    try {
      const res = await axios.get (
        `${BACKENDURL}/employee/find?position=${id}`
      );
      setLoadingEmployee (false);
      setEmployeeData (res.data.employees);
    } catch (error) {
      openNotification ('error', error.response.data.message, 3, 'red');
      setLoadingEmployee (false);
    }
  };

  const EmployeeOptions = employeeData
    ? employeeData.map (branch => ({
        value: branch.id,
        label: branch.IDNO + ' ' + branch.fName + ' ' + branch.mName,
      }))
    : [];

  useEffect (
    () => {
      getEmployeeData (positionId);
    },
    [positionId]
  );

  const getDepartmentData = async id => {
    setLoadingDepartment (true);
    form.resetFields (['department','employee']);
    try {
      const res = await axios.get (
        `${BACKENDURL}/organzation/department/find?branchId=${id}`
      );
      setLoadingDepartment (false);
      setDepartmentData (res.data.departments);
    } catch (error) {
      openNotification ('error', error.response.data.message, 3, 'red');
      setLoadingDepartment (false);
    }
  };

  const departmentOptions = departmentData
    ? departmentData.map (department => ({
        value: department.id,
        label: department.name,
      }))
    : [];

  useEffect (
    () => {
      getDepartmentData (branchId);
    },
    [branchId]
  );

  const getPositionData = async id => {
    setLoadingPosition (true);
    form.resetFields (['position', 'employee']);
    try {
      const res = await axios.get (
        `${BACKENDURL}/organzation/position/find?departmentId=${id}`
      );
      setLoadingPosition (false);
      setPositionData (res.data.positions);
    } catch (error) {
      openNotification ('error', error.response.data.message, 3, 'red');
      setLoadingPosition (false);
    }
  };

  const positionOptions = positionData
    ? positionData.map (department => ({
        value: department.id,
        label: department.name,
      }))
    : [];

  useEffect (
    () => {
      getPositionData (departmentId);
    },
    [departmentId]
  );

  const onFinish = async values => {
    setLoading (true);
    try {
      const res = await axios.post (`${BACKENDURL}/project/SwapEmployee`, {
        empId: empId,
        employees: values.employee,
        project: projectId,
        reason:values.reason,
        attachment:attachment,
      });
      reload ();
      setLoading (false);
      openModalFun (false);
      openNotification ('success', res.data.message, 3, 'green');
      form.resetFields ();
    } catch (error) {
      setLoading (false);
      openNotification ('error', error.response.data.message, 3, 'red');
    }
  };
  const onFinishFailed = errorInfo => {
    console.log ('Failed:', errorInfo);
  };

  return (
    <Form
      layout="vertical"
      onFinish={onFinish}
      form={form}
      onFinishFailed={onFinishFailed}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >

        <Form.Item
          style={{margin: '5px', width: '47%'}}
          label="Branch"
          name="branch"
          rules={[
            {
              required: true,
              message: 'Please input Branch',
            },
          ]}
        >
          <Select
            placeholder="Search to Select"
            onChange={e => setBranchId (e)}
            options={branchOptions}
            loading={loadingBranch}
            disabled={loadingBranch}
          />
        </Form.Item>
        <Form.Item
          style={{margin: '5px', width: '47%'}}
          label="Department"
          name="department"
          rules={[
            {
              required: true,
              message: 'Please input Department',
            },
          ]}
        >
          <Select
            placeholder="Search to Select"
            onChange={e => setDepartmentId (e)}
            options={departmentOptions}
            loading={loadingDepartment}
            disabled={loadingDepartment}
          />
        </Form.Item>

        <Form.Item
          style={{margin: '5px', width: '47%'}}
          label="Position"
          name="position"
          rules={[
            {
              required: true,
              message: 'Please input Department',
            },
          ]}
        >
          <Select
            placeholder="Search to Select"
            onChange={e => setPositionId (e)}
            options={positionOptions}
            loading={loadingPosition}
            disabled={loadingPosition}
          />
        </Form.Item>

        <Form.Item
          style={{margin: '5px', width: '100%'}}
          label="Employee"
          name="employee"
          rules={[
            {
              required: true,
              message: 'Please input Department',
            },
          ]}
        >
          <Select
            placeholder="Search to Select"
            options={EmployeeOptions}
            loading={loadingEmployee}
            disabled={loadingEmployee}
          />
        </Form.Item>
        <Divider>Reason For Swap</Divider>

        <Form.Item
          style={{margin: '5px', width: '100%'}}
          label="Reason"
          name="reason"
          rules={[
            {
              required: true,
              message: 'Please input Reason',
            },
          ]}
        >
          <TextArea />
        </Form.Item>
        
        <Form.Item
          style={{margin: '5px 0', width: '100%'}}
          label="Attachment"
          name="attachment"
        >
          <Dragger
            name="file"
            action={`${BACKENDURL}/upload/new`}
            accept="image/*"
            onChange={e => {
              if (e.file.status === 'done')
                setattachment (e.file.name);
            }}
            multiple={false}
            maxCount={1}
          >
            <div className="ant-upload-drag-icon">
              <FaUpload />
            </div>
            <div className="ant-upload-hint">
              Support for a single Image file. Max size 3MB.
            </div>
          </Dragger>
        </Form.Item>

      </div>
      <Form.Item
        style={{display: 'flex', justifyContent: 'center', marginTop: '15px'}}
      >
        <Button
          type="primary"
          htmlType="submit"
          disabled={loading}
          loading={loading}
        >
          Swap
        </Button>
      </Form.Item>
    </Form>
  );
};

export default SwapEmployee;
