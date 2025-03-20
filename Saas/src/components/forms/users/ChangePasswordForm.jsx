import {Button, Form, Input, Select} from 'antd';
import axios from 'axios';
import React, {useContext, useEffect, useState} from 'react';
import {AlertContext} from '../../../context/AlertContext';
import {BACKENDURL} from '../../../helper/Urls';
import TextArea from 'antd/es/input/TextArea';

const ChangePasswordForm = ({openModalFun, reload,id}) => {
  const {openNotification} = useContext (AlertContext);
  const [loading, setLoading] = useState (false);
  const [form] = Form.useForm ();

  const onFinish = async values => {
    setLoading (true);
    try {
      const res = await axios.post (`${BACKENDURL}/user/changepassword`, {
        newPassword: values.newPassword,
        oldPassword: values.oldPassword,
        id:id,
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
        <Form.Item
          style={{margin: '5px', width: '100%'}}
          label="Old Password"
          name="oldPassword"
          rules={[
            {
              required: true,
              message: 'Please input Old Password',
            },
          ]}
        >
          <Input.Password/>
        </Form.Item>
        <Form.Item
          style={{margin: '5px', width: '100%'}}
          label="New Password"
          name="newPassword"
          rules={[
            {
              required: true,
              message: 'Please input New Password',
            },
          ]}
        >
          <Input.Password/>
        </Form.Item>
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

export default ChangePasswordForm;
