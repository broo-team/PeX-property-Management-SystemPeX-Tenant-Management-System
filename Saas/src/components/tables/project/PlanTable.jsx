import React, {useEffect, useState} from 'react';
import {
  Table,
  Button,
  Spin,
  Modal,
  Form,
  Input,
  message,
  Select,
  Image,
} from 'antd';
import axios from 'axios';
import {useNavigate} from 'react-router-dom'; // Change here
import {BACKENDURL} from '../../../helper/Urls';
//import NewProjectForm from '../../components/forms/project/NewProjectForm';

const {Option} = Select;

const PlanTable = ({loadingData, datas}) => {
  const [loading, setLoading] = useState (true);
  const [planData, setPlanData] = useState ([]);
  const [companies, setCompanies] = useState ([]);
  const [editModalVisible, setEditModalVisible] = useState (false);
  const [currentItem, setCurrentItem] = useState (null);
  const [form] = Form.useForm ();
  const navigate = useNavigate (); // Change here

  // Fetch plan data and company data from the server
  useEffect (() => {
    const fetchData = async () => {
      setLoading (true);
      try {
        const [plansResponse, companiesResponse] = await Promise.all ([
          axios.get (`${BACKENDURL}/plan/plans`),
          axios.get (`${BACKENDURL}/company/all`),
        ]);
        setPlanData (plansResponse.data);
        setCompanies (companiesResponse.data.companies);
      } catch (error) {
        message.error ('Failed to fetch data');
      } finally {
        setLoading (false);
      }
    };

    fetchData ();
  }, []);

  // Handle edit button click
  const handleEdit = record => {
    setCurrentItem (record);
    form.setFieldsValue (record); // Populate the form with existing plan data
    setEditModalVisible (true);
  };

  // Handle update plan form submission
  const handleUpdatePlan = async values => {
    try {
      await axios.put (`${BACKENDURL}/plan/plan/${currentItem.id}`, values);
      message.success ('Plan updated successfully');
      setEditModalVisible (false);
      // Refresh the data
      const response = await axios.get (`${BACKENDURL}/plan/all`);
      setPlanData (response.data);
    } catch (error) {
      message.error ('Failed to update plan');
    }
  };

  // Navigate to NewProjectForm with company ID
  const handleGoToNewProjectForm = companyId => {
    navigate (`../project/list`); // Change here
  };

  // Table columns definition
  const columns = [
    {
      title: 'Company',
      dataIndex: 'companyId',
      key: 'companyId',
      render: companyId => {
        const company = companies.find (comp => comp.id === companyId);
        return company ? company.name : 'Unknown';
      },
    },
    {
      title: 'Site',
      dataIndex: 'site',
      key: 'site',
    },
    {
      title: 'Employee No',
      dataIndex: 'noSecurity',
      key: 'noSecurity',
    },
    {
      title: 'Price per Employee',
      dataIndex: 'price',
      key: 'price',
    },
    {
      title: 'Attachments',
      dataIndex: 'attachments',
      key: 'attachments',
      render: r =>  r?<a
      target='_blank'
      href={`${BACKENDURL}/uploads/new/${r}`}
      >View</a>:'none',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="default"
          onClick={() => handleGoToNewProjectForm (record.companyId)}
          style={{marginLeft: 8}}
        >
          New Project
        </Button>
      ),
    },
  ];

  return (
    <div>
      {loading
        ? <Spin size="large" />
        : <Table
            columns={columns}
            dataSource={datas}
            loading={loadingData}
            rowKey="id"
            scroll={{
              x: 500,
            }}
            pagination={{pageSize: 10}}
          />}

      <Modal
        title="Edit Plan"
        visible={editModalVisible}
        onCancel={() => setEditModalVisible (false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdatePlan}
          initialValues={currentItem}
        >
          <Form.Item
            name="securityNo"
            label="Employee No"
            rules={[{required: true, message: 'Please enter security number'}]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item
            name="pricePerSecurity"
            label="Price per Employee"
            rules={[
              {required: true, message: 'Please enter price per security'},
            ]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item
            name="companyId"
            label="Company"
            rules={[{required: true, message: 'Please select a company'}]}
          >
            <Select placeholder="Select a company">
              {companies.map (company => (
                <Option key={company.id} value={company.id}>
                  {company.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Save
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PlanTable;
