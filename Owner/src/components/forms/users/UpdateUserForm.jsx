import {Button, DatePicker, Form, Input, Select} from 'antd';
import axios from 'axios';
import React, {useContext, useEffect, useState} from 'react';
import { AlertContext } from '../../../context/AlertContext';
import { BACKENDURL } from '../../../helper/Urls';

const UpdateUserForm = ({openModalFun,reload,id}) => {
  const {openNotification} = useContext (AlertContext);
  const [loading, setLoading] = useState (false);
  const [form] = Form.useForm();

  const onFinish = async values => {
    setLoading (true);
    try {
      const res = await axios.post (`${BACKENDURL}/users/update`,{
        userName: values.userName,
        email: values.email,
        access: values.access,
        tasks: values.tasks,
      });
      reload()
      setLoading (false);
      openModalFun(false)
      openNotification ('success', res.data.message, 3, 'green');
      form.resetFields()
    } catch (error) {
      setLoading (false);
      console.log(error)
      openNotification ('error', error.response.data.message, 3, 'red');
    }
  };
  const onFinishFailed = errorInfo => {
    console.log ('Failed:', errorInfo);
  };

  const [userData,setUserData]=useState([])

  const getUserData=async()=>{
    try {
      const res = await axios.get(`${BACKENDURL}/users/detail?id=${id}`);
      setUserData(res.data.user)
    } catch (error) {
      openNotification('error', error.response.data.message, 3, 'red');
    }
  }

  useEffect(()=>{
    getUserData()

    return setUserData([])
  },[id])

  return (
    <div>
      {Object.keys(userData).length > 0 ? (
      <Form
      layout="vertical"
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      initialValues={userData}
      disabled={loading}
      autoComplete="on"
      autoFocus="true"
    >
      <div style={{display:'grid',gridTemplateColumns:'auto auto'}}>
      <Form.Item
        style={{margin: '5px'}}
        label="IDNO"
        name="IDNO"
      >
        <Input disabled/>
      </Form.Item>

      <Form.Item
        style={{margin: '5px'}}
        label="Email"
        name="email"
      >
        <Input disabled/>
      </Form.Item>

      <Form.Item
        style={{margin: '5px'}}
        label="username"
        rules={[
          {
            required: true,
            message: 'Please input fullname',
          },
        ]}
        name="userName"
      >
        <Input />
      </Form.Item>

      <Form.Item
          style={{margin: '5px 0', width: '100%'}}
          label="Tasks"
          rules={[
            {
              required: true,
              message: 'Please input Tasks',
            },
          ]}
          name="tasks"
        >
          <Select
            showSearch
            mode='multiple'
            maxTagCount='responsive'
            placeholder="Search to Select"
            optionFilterProp="children"
            options={[
              {
                value: 'Full',
                label: 'Full System Access',
              },
              {
                value: 'Employee',
                label: 'Employee',
              },
              {
                value: 'Vacancy',
                label: 'Vacancy',
              },
              {
                value: 'Organzation',
                label: 'Organzation',
              },
              {
                value: 'Project',
                label: 'Project',
              },
              {
                value: 'Leave',
                label: 'leave',
              },
              {
                value: 'Asset',
                label: 'Asset',
              },
              {
                value: 'Attendance',
                label: 'Attendance',
              },
              {
                value: 'Payroll',
                label: 'Payroll',
              },
              {
                value: 'Daily Report',
                label: 'Daily Report',
              },
              {
                value: 'Doc',
                label: 'Doc',
              },
            ]}
          />
        </Form.Item>

        <Form.Item
          style={{margin: '5px 0', width: '49%'}}
          label="Access"
          rules={[
            {
              required: true,
              message: 'Please input Access',
            },
          ]}
          name="access"
        >
          <Select
            showSearch
            placeholder="Search to Select"
            optionFilterProp="children"
            filterOption={(input, option) => (option?.label ?? '').includes(input)}
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
            }
            options={[
              {
                value: 'Read',
                label: 'Read',
              },
              {
                value: 'Write',
                label: 'Write',
              },
            ]}
          />
        </Form.Item>
        
        <Form.Item
          style={{margin: '5px 0', width: '49%'}}
          label="Effective Till"
          name="effectiveTill"
        >
          <DatePicker style={{width:'100%'}}/>
        </Form.Item>
      </div>
      <Form.Item
        style={{display: 'flex', justifyContent: 'center', marginTop: '15px'}}
      >
        <Button
          type="primary"
          style={{marginRight:'10px'}}
          htmlType="submit"
          disabled={loading}
          loading={loading}
        >
          Update
        </Button>
        <Button
          type='default'
          onClick={()=>openModalFun(false)}
        >
          Cancel
        </Button>
      </Form.Item>
    </Form>
    ) : (
      <p>Loading User data...</p>
    )}
    </div>
  );
};

export default UpdateUserForm;
