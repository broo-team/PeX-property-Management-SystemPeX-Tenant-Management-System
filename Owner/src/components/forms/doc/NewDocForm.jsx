import {Button, Form, Input, Select} from 'antd';
import axios from 'axios';
import React, {useContext, useEffect, useState} from 'react';
import {AlertContext} from '../../../context/AlertContext';
import {BACKENDURL} from '../../../helper/Urls';
import Dragger from 'antd/es/upload/Dragger';
import {FaUpload} from 'react-icons/fa6';

const NewDocForm = ({openModalFun, reload}) => {
  const {openNotification} = useContext (AlertContext);
  const [loading, setLoading] = useState (false);
  const [form] = Form.useForm ();

  const [typesData, settypesData] = useState ([]);
  const [loadingType, setLoadingType] = useState (false);

  const gettypesData = async () => {
    setLoadingType (true);
    try {
      const res = await axios.get (`${BACKENDURL}/doc/type/all`);
      setLoadingType (false);
      settypesData (res.data.docTypes);
    } catch (error) {
      openNotification ('error', error.response.data.message, 3, 'red');
      setLoadingType (false);
    }
  };

  const typeOptions = typesData.length
  ? typesData.map(branch => ({
    value: branch.id,
    label: branch.name 
  }))
  : [];

  useEffect(() => {
    gettypesData ();
  }, []);

  const onFinish = async values => {
    setLoading (true);
    try {
      const res = await axios.post (`${BACKENDURL}/doc/new`, {
        name: values.name,
        type: values.type,
        author: values.author,
        docRef:values.docRef,
        attachment: values.attachment.file.name,
      });
      reload ();
      setLoading (false);
      openModalFun (false);
      openNotification ('success', res.data.message, 3, 'green');
      form.resetFields ();
    } catch (error) {
      setLoading (false);
      console.log(error)
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
          style={{margin: '5px 0', width: '65%'}}
          label="Doc Name"
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
          style={{margin: '5px 0', width: '34%'}}
          label="Type"
          name="type"
          rules={[
            {
              required: true,
              message: 'Please input Type',
            },
          ]}
        >
          <Select
            placeholder="Search to Select"
            options={typeOptions}
            loading={loadingType}
            disabled={loadingType}
          />
        </Form.Item>
        <Form.Item
          style={{margin: '5px 0', width: '49%'}}
          label="Author"
          rules={[
            {
              required: true,
              message: 'Please input Author',
            },
          ]}
          name="author"
        >
          <Input />
        </Form.Item>

        <Form.Item
          style={{margin: '5px 0', width: '50%'}}
          label="Doc Ref"
          rules={[
            {
              required: true,
              message: 'Please input docRef',
            },
          ]}
          name="docRef"
        >
          <Input />
        </Form.Item>
        <Form.Item
          style={{margin: '5px 0', width: '100%'}}
          label="Attachment"
          name="attachment"
          rules={[
            {
              required: true,
              message: 'Please input Attachment',
            },
          ]}
        >
          <Dragger
            action={`${BACKENDURL}/upload/new`}
            multiple={false}
            maxCount={1}
          >
            <div className="ant-upload-drag-icon">
              <FaUpload />
            </div>
            <div className="ant-upload-hint">
              Support for a single file.
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
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

export default NewDocForm;
