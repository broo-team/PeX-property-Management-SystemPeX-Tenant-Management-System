// components/forms/users/ChangePasswordForm.jsx
import { Button, Form, Input } from 'antd';
import axios from 'axios';
import React, { useContext, useState } from 'react'; // React import often not needed explicitly with new JSX transform
import { AlertContext } from '../../../context/AlertContext';
import { useAuth } from '../../../context/AuthContext';
import { BACKENDURL } from '../../../helper/Urls';

const ChangePasswordForm = ({ openModalFun, reload }) => {
  const { openNotification } = useContext(AlertContext);
  const { buildingId } = useAuth(); // Assuming buildingId is required for the endpoint
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Good check to ensure buildingId is loaded before rendering the form
  if (!buildingId) return <div>Loading building data...</div>;

  const onFinish = async (values) => {
    setLoading(true);
    // Endpoint construction looks correct
    const endpoint = `${BACKENDURL}/api/buildings/${buildingId}/change-password`;

    try {
      // Correctly sending oldPassword and newPassword
      const response = await axios.put(endpoint, {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });

      openNotification('success', 'Success', response.data.message || 'Password changed successfully.');
      form.resetFields();
      openModalFun();
      // This line is commented out - uncomment if you need to trigger a reload
      // reload && reload(); 

    } catch (error) {
      console.error('Error changing password:', error);

      // Robust error message extraction
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        'An unknown error occurred while changing password.';

      openNotification('error', 'Error', message);
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
    openNotification('error', 'Validation Error', 'Please check the form for errors.');
  };

  return (
    <Form
      layout="vertical"
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      form={form}
    >
      <Form.Item
        label="Old Password"
        name="oldPassword"
        rules={[{ required: true, message: 'Please input your Old Password' }]}
        style={{ margin: '5px', width: '100%' }}
      >
        <Input.Password />
      </Form.Item>

      <Form.Item
        label="New Password"
        name="newPassword"
        rules={[
          { required: true, message: 'Please input your New Password' },
          { min: 6, message: 'Password must be at least 6 characters' },
        ]}
        style={{ margin: '5px', width: '100%' }}
      >
        <Input.Password />
      </Form.Item>

      {/* Correct validation for confirming new password */}
      <Form.Item
        label="Confirm New Password"
        name="confirmNewPassword"
        dependencies={['newPassword']}
        hasFeedback
        rules={[
          { required: true, message: 'Please confirm your New Password!' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('newPassword') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('The two passwords that you entered do not match!'));
            },
          }),
        ]}
        style={{ margin: '5px', width: '100%' }}
      >
        <Input.Password />
      </Form.Item>

      <Form.Item style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
        <Button type="primary" htmlType="submit" loading={loading} disabled={loading}>
          Change Password
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ChangePasswordForm;