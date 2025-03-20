import React, {useState} from 'react';
import {Form, Input, Button, message, Upload} from 'antd';
import {UploadOutlined} from '@ant-design/icons';
import axios from 'axios';
import {BACKENDURL} from '../../../helper/Urls'; // Adjust the URL as needed
import {FaUpload} from 'react-icons/fa6';
import Dragger from 'antd/es/upload/Dragger';

const NewCompanyForm = ({reload, openModalFun}) => {
  const [form] = Form.useForm ();
  const [loading, setLoading] = useState (false);
  const [licensePic, setLicensePic] = useState ('');
  const [profilePic, setProfilePic] = useState ('');
  const [AgreementFile, setAgreementFile] = useState ('');

  const onFinish = async values => {
    setLoading (true);

    try {
      await axios.post (`${BACKENDURL}/company/add`, {
        name:values.name,
        TIN:values.TIN,
        VAT:values.VAT,
        license:licensePic,
        agreement:AgreementFile,
        profile:profilePic,
        city:values.city,
        subCity:values.subCity,
        wereda:values.wereda,
        houseNo:values.kebele,
        phone:values.phone,
        email:values.email,
        kebele:values.kebele,
      });
      message.success ('Company added successfully');
      setLoading (false);
      form.resetFields ();
      reload (); // Reload the data after adding a new company
      openModalFun (false); // Close the modal
    } catch (error) {
      setLoading (false);
      message.error ('Failed to add company');
    }
  };

  return (
    <Form layout="vertical" onFinish={onFinish} form={form}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <Form.Item
          style={{margin: '5px', width: '100%'}}
          label="Company Name"
          rules={[
            {
              required: true,
              message: 'Please input Name',
            },
          ]}
          name="name"
        >
          <Input />
        </Form.Item>
        <Form.Item
          style={{margin: '5px 0', width: '49%'}}
          label="Company TIN"
          name="TIN"
        >
          <Input />
        </Form.Item>
        <Form.Item
          style={{margin: '5px 0', width: '49%'}}
          label="VAT"
          name="VAT"
        >
          <Input />
        </Form.Item>
        <Form.Item
          style={{margin: '5px 0', width: '49%'}}
          label="Phone"
          rules={[
            {
              required: true,
              message: 'Please input Phone',
            },
          ]}
          name="phone"
        >
          <Input />
        </Form.Item>
        <Form.Item
          style={{margin: '5px 0', width: '49%'}}
          label="Email"
          rules={[
            {
              type: 'email',
            },
          ]}
          name="email"
        >
          <Input />
        </Form.Item>
        <Form.Item
          style={{margin: '5px 0', width: '59%'}}
          label="City"
          rules={[
            {
              required: true,
              message: 'Please input City',
            },
          ]}
          name="city"
        >
          <Input />
        </Form.Item>
        <Form.Item
          style={{margin: '5px 0', width: '40%'}}
          label="SubCity"
          rules={[
            {
              required: true,
              message: 'Please input SubCity',
            },
          ]}
          name="subCity"
        >
          <Input />
        </Form.Item>
        <Form.Item
          style={{margin: '5px 0', width: '33%'}}
          label="Wereda"
          name="wereda"
        >
          <Input />
        </Form.Item>
        <Form.Item
          style={{margin: '5px 0', width: '33%'}}
          label="Kebele"
          name="kebele"
        >
          <Input />
        </Form.Item>
        <Form.Item
          style={{margin: '5px 0', width: '33%'}}
          label="House No"
          name="houseNo"
        >
          <Input />
        </Form.Item>

        <Form.Item
          style={{margin: '5px 0', width: '100%'}}
          label="agreement"
          name="agreement"
        >
          <Dragger
            name="file"
            action={`${BACKENDURL}/upload/new`}
            accept="pdf"
            onChange={e => {
              if (e.file.status === 'done')
                setAgreementFile (e.file.response.name.filename);
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

        <Form.Item
          style={{margin: '5px 0', width: '49%'}}
          label="license"
          name="license"
        >
          <Dragger
            name="file"
            action={`${BACKENDURL}/upload/new`}
            accept="image/*"
            onChange={e => {
              if (e.file.status === 'done')
                setLicensePic (e.file.response.name.filename);
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

        <Form.Item
          style={{margin: '5px 0', width: '49%'}}
          label="Profile"
          name="profile"
        >
          <Dragger
            name="file"
            action={`${BACKENDURL}/upload/new`}
            accept="image/*"
            onChange={e => {
              if (e.file.status === 'done')
                setProfilePic (e.file.response.name.filename);
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
          Publish
        </Button>
      </Form.Item>
    </Form>
  );
};

export default NewCompanyForm;
