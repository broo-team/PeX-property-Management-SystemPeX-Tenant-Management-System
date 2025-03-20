import React, {useEffect, useState} from 'react';
import {Form, Input, Button, message, Upload, Select, Tooltip} from 'antd';
import axios from 'axios';
import {BACKENDURL} from '../../../helper/Urls';
import Dragger from 'antd/es/upload/Dragger';
import {FaUpload} from 'react-icons/fa';

const NewPlanForm = ({reload, openModalFun}) => {
  const [form] = Form.useForm ();
  const [companies, setCompanies] = useState ([]);
  const [companiesLoading, setCompaniesLoading] = useState (false);
  const [newLoading, setNewLoading] = useState (false);
  const [attachmentFile, setattachmentFile] = useState ('');

  useEffect (() => {
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

  const handleSubmit = async values => {
    setNewLoading (true);
    try {
      await axios.post (`${BACKENDURL}/plan/plan/add`, {
        site: values.site,
        noSecurity: values.securityNo,
        price: values.pricePerSecurity,
        attachments:attachmentFile,
        companyId: values.companyId,
      });
      message.success ('Plan added successfully');
      setNewLoading (false);
      openModalFun (false);
      reload ();
    } catch (error) {
      setNewLoading (false);
      console.error ('Failed to add plan:', error);
      message.error ('Failed to add plan');
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit} style={{width:'100%',display:'flex',justifyContent:'space-between',flexWrap:'wrap'}}>
      <Form.Item
        name="companyId"
        label="Company"
        style={{width:'100%'}}
        rules={[{required: true, message: 'Please select a company'}]}
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
        name="site"
        style={{width:'49%'}}
        label="Site Name"
        rules={[{required: true, message: 'Please enter site name'}]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="securityNo"
        style={{width:'24%'}}
        label="Employee No"
        rules={[{required: true, message: 'Please enter security number'}]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="pricePerSecurity"
        style={{width:'25%'}}
        label={<Tooltip title="Price per Security">Price</Tooltip>}
        rules={[{required: true, message: 'Please enter price per security'}]}
      >
        <Input type="number" />
      </Form.Item>
      <Form.Item name="attachments" label="Attachments"
        style={{width:'100%'}}
        >
        <Dragger multiple={false} maxCount={1}
        action={`${BACKENDURL}/upload/new`}
        onChange={e => {
          if (e.file.status === 'done')
            setattachmentFile (e.file.response.name.filename);
        }}
        >
          <p className="ant-upload-drag-icon">
            <FaUpload />
          </p>

          <p className="ant-upload-hint">
            Support for a single
            {' '}
            file. Max size 3MB.
          </p>
        </Dragger>
      </Form.Item>
      <Form.Item>
        <Button disabled={newLoading} loading={newLoading} type="primary" htmlType="submit">
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

export default NewPlanForm;
