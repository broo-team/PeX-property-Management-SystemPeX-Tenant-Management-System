import React, { useEffect, useState } from 'react';
import { Form, Input, Button, message, Upload, Select } from 'antd';
import axios from 'axios';
import { BACKENDURL } from '../../../helper/Urls';
import { FaUpload } from 'react-icons/fa';
import Dragger from 'antd/es/upload/Dragger';

const EditProjectForm = ({ reload, openModalFun,id }) => {
  const [form] = Form.useForm();

  const [attachmentFile, setattachmentFile] = useState ('');

  const [loading,setLoading]=useState(false)
  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      await axios.put(`${BACKENDURL}/project/edit/${id}`,{
        site:values.site,
      city:values.city,
      subCity:values.subCity,
      startDate:values.startDate,
      endDate:values.endDate,
      noSecurity:values.noSecurity,
      attachments:attachmentFile,
      price:values.price,
      });
      setLoading(false)
      message.success('Project Updated successfully');
      openModalFun(false);
      reload();
    } catch (error) {
      setLoading(false)
      message.error('Failed to Update project');
    }
  };
  
  

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
    >
      <div style={{width:'100%',display:'flex',flexWrap:'wrap',rowGap:'5px',justifyContent:'space-between',marginBottom:'10px'}}>
      <Form.Item
        label="City / Region"
        name="city"
        style={{width:'49%',margin:0}}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="subCity"
        label="Sub City / Zone"
        style={{width:'50%',margin:0}}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="Site Name"
        name="site"
        style={{width:'48%',margin:0}}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="noSecurity"
        style={{width:'20%',margin:0}}
        label="Quantity"
      >
        <Input type='number'/>
      </Form.Item>
      <Form.Item
        name="price"
        style={{width:'30%',margin:0}}
        label="OT Price Rate"
      >
        <Input type='number'/>
      </Form.Item>

      <Form.Item
        name="startDate"
        style={{width:'49%',margin:0}}
        label="Start Date"
      >
        <Input type='date'/>
      </Form.Item>

      <Form.Item
        style={{width:'49%',margin:0}}
        name="endDate"
        label="End Date"
      >
        <Input type='date'/>
      </Form.Item>

      <Form.Item
        name="Attachment"
        label="attachment"
        style={{width:'100%',margin:0}}
      >
        <Dragger
            name="file"
            action={`${BACKENDURL}/upload/new`}
            onChange={e => {
              if (e.file.status === 'done')
                setattachmentFile (e.file.name);
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
      <Form.Item>
        <Button type="primary" htmlType="submit"
        loading={loading}
        disabled={loading}>
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

export default EditProjectForm;