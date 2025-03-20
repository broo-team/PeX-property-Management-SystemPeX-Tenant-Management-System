import React, {useState, useEffect} from 'react';
import {Form, InputNumber, Select, Button, message} from 'antd';
import axios from 'axios';
import {BACKENDURL} from '../../../helper/Urls';

const {Option} = Select;

const NewRequestForm = ({reload, openModalFun}) => {
  const [loading, setLoading] = useState (false);
  const [inventoryData, setInventoryData] = useState ([]);
  const [employeeData, setEmployeeData] = useState ([]);
  const [form] = Form.useForm ();

  // Fetch inventory and employee data when the component mounts
  useEffect (() => {
    const fetchData = async () => {
      try {
        const [inventoryResponse, employeeResponse] = await Promise.all ([
          axios.get (`${BACKENDURL}/request/inventory`),
          axios.get (`${BACKENDURL}/request/employees`),
        ]);
        setInventoryData (inventoryResponse.data);
        setEmployeeData (employeeResponse.data);
      } catch (error) {
        console.error ('Error fetching data:', error);
        message.error ('Failed to fetch data from the server.');
      }
    };
    fetchData ();
  }, []);

  const onFinish = async values => {
    setLoading (true);
    try {
      // Ensure the inventory exists and has enough quantity
      const selectedInventory = inventoryData.find (
        item => item.id === values.inventoryId
      );
      if (selectedInventory && selectedInventory.quantity < values.quantity) {
        message.error ('Insufficient inventory quantity.');
        return;
      }

      await axios.post (`${BACKENDURL}/request/create`, values); // Adjust URL to your API endpoint
      reload (); // Reload request data after successful creation
      openModalFun (false); // Close the modal
      form.resetFields (); // Reset the form fields
      message.success ('Request created successfully');
    } catch (error) {
      setLoading (false);
      console.error ('Error creating request:', error);
      message.error ('Failed to create request. Please try again.');
    }
    setLoading (false);
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
      {/* Inventory Name (Select from inventory) */}
      <Form.Item
        label="Inventory Name"
        name="inventoryId"
        rules={[{required: true, message: 'Please select the inventory!'}]}
      >
        <Select placeholder="Select Inventory">
          {inventoryData.map (item => (
            <Option key={item.id} value={item.id}>
              {item.name} (Available: {item.quantity})
            </Option>
          ))}
        </Select>
      </Form.Item>

      {/* Quantity (User selects or inputs based on available inventory) */}
      <Form.Item
        label="Quantity"
        name="quantity"
        rules={[{required: true, message: 'Please input the quantity!'}]}
      >
        <InputNumber
          min={1}
          placeholder="Enter Quantity"
          style={{width: '100%'}}
        />
      </Form.Item>

      {/* Employee Name (Select from employee data) */}
      <Form.Item
        label="Employee Name"
        name="employeeId"
        rules={[{required: true, message: 'Please select an employee!'}]}
      >
        <Select placeholder="Select Employee">
          {employeeData.map (employee => (
            <Option key={employee.id} value={employee.id}>
              {employee.fName} {employee.lName}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          disabled={loading}
        >
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

export default NewRequestForm;
