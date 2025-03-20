import React, {useState} from 'react';
import {Form, Input, Button, message, Upload} from 'antd';
import axios from 'axios';
import {BACKENDURL} from '../../../helper/Urls'; // Adjust the URL as needed
import {FaUpload} from 'react-icons/fa6';
import Dragger from 'antd/es/upload/Dragger';
import TextArea from 'antd/es/input/TextArea';

const RemoveEmployee = ({reload, openModalFun,id}) => {
  const [form] = Form.useForm ();
  const [loading, setLoading] = useState (false);
  const [attachment, setattachment] = useState ('none');

  const onFinish = async values => {
    setLoading (true);

    try {
      await axios.post (`${BACKENDURL}/project/employeeremove`, {
        IDNO:id,
        reason:values.reason,
        attachment:attachment,
      });
      message.success ('Employee Removed successfully');
      setLoading (false);
      form.resetFields ();
      reload (); // Reload the data after adding a new company
      openModalFun (false); // Close the modal
    } catch (error) {
      setLoading (false);
      message.error ('Failed to Removed');
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
          Confirm Remove
        </Button>
      </Form.Item>
    </Form>
  );
};

export default RemoveEmployee;
