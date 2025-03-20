import {Button, Form, Input, Select} from 'antd';
import axios from 'axios';
import React, {useContext, useEffect, useState} from 'react';
import {AlertContext} from '../../../context/AlertContext';
import {BACKENDURL} from '../../../helper/Urls';
import TextArea from 'antd/es/input/TextArea';

const NewMessageForm = ({openModalFun, reload}) => {
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
  ? employeeData.map(emp => ({
    value: emp.empId,
    label: emp.IDNO +"-"+emp.fName+" "+emp.mName+" "+(emp.lName?emp.lName:"") 
  }))
  : [];

  useEffect(() => {
    getemployeeData ();
  }, []);

  const onFinish = async values => {
    setLoading (true);
    try {
      const res = await axios.post (`${BACKENDURL}/leave/application/new`, {
        employee: values.employee,
        leaveType: values.leaveType,
        reason: values.reason,
        startDate: values.startDate+ "T00:00:00Z",
        endDate: values.endDate+ "T00:00:00Z",
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
          style={{margin: '5px 0', width: '49%'}}
          label="Branch"
          name="branch"
        >
          <Select
            placeholder="Search to Select"
            onChange={(e)=>setemployeeId(e)}
            options={employeeOptions}
            loading={loadingEmployee}
            disabled={loadingEmployee}
          />
        </Form.Item>
        <Form.Item
          style={{margin: '5px 0', width: '49%'}}
          label="Department"
          name="department"
        >
          <Select
            placeholder="Search to Select"
            onChange={(e)=>setemployeeId(e)}
            options={employeeOptions}
            loading={loadingEmployee}
            disabled={loadingEmployee}
          />
        </Form.Item>
        <Form.Item
          style={{margin: '5px 0', width: '39%'}}
          label="Position"
          name="position"
        >
          <Select
            placeholder="Search to Select"
            onChange={(e)=>setemployeeId(e)}
            options={employeeOptions}
            loading={loadingEmployee}
            disabled={loadingEmployee}
          />
        </Form.Item>
        <Form.Item
          style={{margin: '5px 0', width: '60%'}}
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
            onChange={(e)=>setemployeeId(e)}
            options={employeeOptions}
            loading={loadingEmployee}
            disabled={loadingEmployee}
          />
        </Form.Item>
        <Form.Item
          style={{margin: '5px', width: '100%'}}
          label="Subject"
          name="subject"
          rules={[
            {
              required: true,
              message: 'Please input Subject',
            },
          ]}
        >
          <Input/>
        </Form.Item>

        <Form.Item
          style={{margin: '5px', width: '100%'}}
          label="Message"
          name="message"
          rules={[
            {
              required: true,
              message: 'Please input Message',
            },
          ]}
        >
          <TextArea/>
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
          Send
        </Button>
      </Form.Item>
    </Form>
  );
};

export default NewMessageForm;
