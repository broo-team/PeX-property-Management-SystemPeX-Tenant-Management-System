import React, { useEffect, useState } from 'react';
import { Form, Input, Button, message, Upload, Select } from 'antd';
import axios from 'axios';
import { BACKENDURL } from '../../../helper/Urls';
import { UploadOutlined } from '@ant-design/icons';
import { FaUpload } from 'react-icons/fa';
import Dragger from 'antd/es/upload/Dragger';

const NewProjectForm = ({ reload, openModalFun }) => {
  const [form] = Form.useForm();


  const [companies, setCompanies] = useState ([]);
  const [companiesLoading, setCompaniesLoading] = useState (false);
  const [attachmentFile, setattachmentFile] = useState ('');

  useEffect(() => {
    const fetchCompanies = async () => {
      setCompaniesLoading (true);
      try {
        const response = await axios.get (`${BACKENDURL}/plan/companies`);
        console.log ('Companies fetched:', response.data); // Debugging line
        setCompaniesLoading (false);
        setCompanies (response.data);
      } catch (error) {
        console.error ('Error fetching companies:', error); // Debugging line
        setCompaniesLoading (false);
        message.error ('Failed to fetch companies');
      }
    };

    fetchCompanies ();
  }, []);

  const [loading,setLoading]=useState(false)
  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      await axios.post(`${BACKENDURL}/project/add`,{
        site:values.site,
      city:values.city,
      subCity:values.subCity,
      company:values.company,
      startDate:values.startDate,
      endDate:values.endDate,
      noSecurity:values.noSecurity,
      attachments:attachmentFile,
      price:values.price,
      });
      setLoading(false)
      message.success('Project added successfully');
      openModalFun(false);
      reload();
    } catch (error) {
      setLoading(false)
      console.error('Failed to add project:', error);
      message.error('Failed to add project');
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
        name="company"
        style={{width:'100%',margin:0}}
        label="Company"
        rules={[{ required: true, message: 'Please enter company name' }]}
      >
        <Select disabled={companiesLoading} loading={companiesLoading} placeholder="Select a company">
          {companies.map (company => (
            <Select.Option key={company.id} value={company.id}>
              {company.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item
        label="City / Region"
        name="city"
        style={{width:'49%',margin:0}}
        rules={[{ required: true, message: 'Please enter City' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="subCity"
        label="Sub City / Zone"
        style={{width:'50%',margin:0}}
        rules={[{ required: true, message: 'Please enter Site' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="Site Name"
        name="site"
        style={{width:'48%',margin:0}}
        rules={[{ required: true, message: 'Please enter Site' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="noSecurity"
        style={{width:'20%',margin:0}}
        label="Quantity"
        rules={[{ required: true, message: 'Please enter Employee no' }]}
      >
        <Input type='number'/>
      </Form.Item>
      <Form.Item
        name="price"
        style={{width:'30%',margin:0}}
        label="OT Price Rate"
        rules={[{ required: true, message: 'Please enter Price Rate' }]}
      >
        <Input type='number'/>
      </Form.Item>

      <Form.Item
        name="startDate"
        style={{width:'49%',margin:0}}
        label="Start Date"
        rules={[{ required: true, message: 'Please enter Start Date' }]}
      >
        <Input type='date'/>
      </Form.Item>

      <Form.Item
        style={{width:'49%',margin:0}}
        name="endDate"
        label="End Date"
        rules={[{ required: true, message: 'Please enter End Date' }]}
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
                setattachmentFile (e.file.response.name.filename);
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

export default NewProjectForm;