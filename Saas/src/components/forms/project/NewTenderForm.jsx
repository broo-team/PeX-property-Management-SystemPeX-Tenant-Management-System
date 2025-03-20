import React, {useState} from 'react';
import {
  Form,
  Input,
  Button,
  message,
  DatePicker,
  Upload,
  Input as AntdInput,
} from 'antd';
import {UploadOutlined} from '@ant-design/icons';
import axios from 'axios';
import {BACKENDURL} from '../../../helper/Urls'; // Adjust the URL as needed
import {FaUpload} from 'react-icons/fa';
import Dragger from 'antd/es/upload/Dragger';

const {TextArea} = Input;

const NewTenderForm = ({reload, openModalFun}) => {
  const [form] = Form.useForm ();
  const [attachmentFile, setAttachmentFile] = useState ('');
  const [loading, setLoading] = useState (false);

  const onFinish = async values => {
    setLoading (true);
    try {
      const formattedValues = {
        ...values,
        deadline: values.deadline ? values.deadline.format ('YYYY-MM-DD') : '',
        startingDate: values.startingDate
          ? values.startingDate.format ('YYYY-MM-DD')
          : '',
        status: 'Pending',
        attachments: attachmentFile,
      };
      await axios.post (`${BACKENDURL}/tender/create`, formattedValues);
      message.success ('Tender added successfully');
      form.resetFields ();
      reload ();
      setLoading (false);
      openModalFun (false);
    } catch (error) {
      setLoading (false);
      message.error ('Failed to add tender');
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        title: '',
        description: '',
        deadline: null,
        budget: '',
        status: 'Pending',
        attachments: '',
        companyName: '',
        startingDate: null,
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexWrap: 'wrap',
          rowGap: '5px',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >

        <Form.Item
          name="title"
          style={{width: '100%', margin: 0}}
          label="Tender Title"
          rules={[{required: true, message: 'Please input the tender title!'}]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="description"
          style={{width: '100%', margin: 0}}
          label="Description"
          rules={[{required: true, message: 'Please input the description!'}]}
        >
          <TextArea rows={4} />
        </Form.Item>

        <Form.Item
          name="companyName"
          style={{width: '100%', margin: 0}}
          label="Company Name"
          rules={[{required: true, message: 'Please input the company name!'}]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          style={{width: '32%', margin: 0}}
          name="startingDate"
          label="Starting Date"
          rules={[
            {required: true, message: 'Please select the starting date!'},
          ]}
        >
          <DatePicker format="YYYY-MM-DD" />
        </Form.Item>

        <Form.Item
          style={{width: '32%', margin: 0}}
          name="deadline"
          label="Deadline"
          rules={[{required: true, message: 'Please select the deadline!'}]}
        >
          <DatePicker format="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item
          style={{width: '32%', margin: 0}}
          name="budget"
          label="Budget"
          rules={[{required: true, message: 'Please input the budget!'}]}
        >
          <AntdInput type="number" />
        </Form.Item>

        <Form.Item
          name="attachments"
          style={{width: '100%', margin: 0}}
          rules={[{required: true, message: 'Please input the budget!'}]}
          label="Attachments"
        >
          <Dragger
            name="file"
            action={`${BACKENDURL}/upload/new`}
            onChange={e => {
              if (e.file.status === 'done')
                setAttachmentFile (e.file.response.name.filename);
            }}
            multiple={false}
            maxCount={1}
          >
            <div className="ant-upload-drag-icon">
              <FaUpload />
            </div>
            <div className="ant-upload-hint">
              Support for a single
              file. Max size 3MB.
            </div>
          </Dragger>
        </Form.Item>
      </div>
      <Form.Item>
        <Button
          disabled={loading}
          loading={loading}
          type="primary"
          htmlType="submit"
        >
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

export default NewTenderForm;
