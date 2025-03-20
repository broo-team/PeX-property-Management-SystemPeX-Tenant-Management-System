import {Button, Form, Input, Select} from 'antd';
import axios from 'axios';
import React, {useContext, useEffect, useState} from 'react';
import {AlertContext} from '../../../context/AlertContext';
import {BACKENDURL} from '../../../helper/Urls';
import TextArea from 'antd/es/input/TextArea';
import Dragger from 'antd/es/upload/Dragger';
import {FaUpload} from 'react-icons/fa';

const NewLeaveApplicationForm = ({openModalFun, reload}) => {
  const {openNotification} = useContext (AlertContext);
  const [loading, setLoading] = useState (false);
  const [form] = Form.useForm ();

  const [employeeData, setemployeeData] = useState ([]);
  const [employeeId, setemployeeId] = useState ('');
  const [loadingEmployee, setloadingEmployee] = useState (false);

  const getemployeeData = async () => {
    setloadingEmployee (true);
    try {
      const res = await axios.get (`${BACKENDURL}/employee/names`);
      setloadingEmployee (false);
      setemployeeData (res.data.employees);
    } catch (error) {
      openNotification ('error', error.response.data.message, 3, 'red');
      setloadingEmployee (false);
    }
  };

  const employeeOptions = employeeData.length
    ? employeeData.map (emp => ({
        value: emp.empId,
        label: emp.IDNO +
          '-' +
          emp.fName +
          ' ' +
          emp.mName +
          ' ' +
          (emp.lName ? emp.lName : ''),
      }))
    : [];

  useEffect (() => {
    getemployeeData ();
  }, []);

  const [leaveTypeData, setleaveTypeData] = useState ([]);
  const [loadingLeaveType, setLoadingLeaveType] = useState (false);

  const getleaveTypeData = async () => {
    setLoadingLeaveType (true);
    try {
      const res = await axios.get (`${BACKENDURL}/leave/alltype`);
      setLoadingLeaveType (false);
      setleaveTypeData (res.data.leaveTypes);
    } catch (error) {
      openNotification ('error', error.response.data.message, 3, 'red');
      setLoadingLeaveType (false);
    }
  };

  const leaveTypeOptions = leaveTypeData.length
    ? leaveTypeData.map (d => ({
        value: d.id,
        label: d.name,
      }))
    : [];

  useEffect (() => {
    getleaveTypeData ();
  }, []);

  const onFinish = async values => {
    setLoading (true);
    try {
      const res = await axios.post (`${BACKENDURL}/leave/application/new`, {
        employee: values.employee,
        leaveType: values.leaveType,
        reason: values.reason,
        attachment: values.attachments.name,
        startDate: values.startDate + 'T00:00:00Z',
        endDate: values.endDate + 'T00:00:00Z',
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
          style={{margin: '5px', width: '100%'}}
          label="Employee"
          name="employee"
          rules={[
            {
              required: true,
              message: 'Please input Employee',
            },
          ]}
        >
          <Select
            placeholder="Search to Select"
            onChange={e => setemployeeId (e)}
            options={employeeOptions}
            loading={loadingEmployee}
            disabled={loadingEmployee}
          />
        </Form.Item>
        <Form.Item
          style={{margin: '5px', width: '100%'}}
          label="Leave Type"
          name="leaveType"
          rules={[
            {
              required: true,
              message: 'Please input Leave Type',
            },
          ]}
        >
          <Select
            placeholder="Search to Select"
            options={leaveTypeOptions}
            loading={loadingLeaveType}
            disabled={loadingLeaveType || leaveTypeData.length < 1}
          />
        </Form.Item>

        <Form.Item
          style={{margin: '5px', width: '47%'}}
          label="Start Date"
          name="startDate"
          rules={[
            {
              required: true,
              message: 'Please input Start',
            },
          ]}
        >
          <Input type="date" />
        </Form.Item>

        <Form.Item
          style={{margin: '5px', width: '47%'}}
          label="End Date"
          name="endDate"
          rules={[
            {
              required: true,
              message: 'Please input End',
            },
          ]}
        >
          <Input type="date" />
        </Form.Item>

        <Form.Item
          style={{margin: '5px', width: '100%'}}
          label="Reason"
          rules={[
            {
              required: true,
              message: 'Please input reason',
            },
          ]}
          name="reason"
        >
          <TextArea />
        </Form.Item>
        <Form.Item
          name="attachments"
          label="Attachments"
          style={{margin: '5px', width: '100%'}}
        >
          <Dragger
            multiple={false}
            maxCount={1}
            action={`${BACKENDURL}/upload/new`}
          >
            <p className="ant-upload-drag-icon">
              <FaUpload />
            </p>

            <p className="ant-upload-hint">
              Support for a single
              {' '}
              file. Max size 3MB.
            </p>
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
          Register
        </Button>
      </Form.Item>
    </Form>
  );
};

export default NewLeaveApplicationForm;
