import {Button, DatePicker, Form, Input, Select} from 'antd';
import axios from 'axios';
import React, {useContext, useEffect, useState} from 'react';
import {AlertContext} from '../../../context/AlertContext';
import {BACKENDURL} from '../../../helper/Urls';
import TextArea from 'antd/es/input/TextArea';

const UpdateAgreementForm = ({openModalFun, reload,id}) => {
  const {openNotification} = useContext (AlertContext);
  const [loading, setLoading] = useState (false);
  const [form] = Form.useForm ();

  const [branchData, setBranchData] = useState ([]);
  const [branchId, setBranchId] = useState ('');
  const [loadingBranch, setLoadingBranch] = useState (false);

  const getBranchData = async () => {
    setLoadingBranch (true);
    try {
      const res = await axios.get (`${BACKENDURL}/organzation/branch/all`);
      setLoadingBranch (false);
      setBranchData (res.data.branchs);
    } catch (error) {
      openNotification ('error', error.response.data.message, 3, 'red');
      setLoadingBranch (false);
    }
  };

  const branchOptions = branchData.length
  ? branchData.map(branch => ({
    value: branch.id,
    label: branch.name 
  }))
  : [];

  useEffect(() => {
    getBranchData ();
  }, []);

  const [departmentData, setDepartmentData] = useState ([]);
  const [loadingDepartment, setLoadingDepartment] = useState (false);
  const [departmentId, setDepartmentId] = useState ('');

  const getDepartmentData = async (id) => {
    setLoadingDepartment (true);
    form.resetFields (['department']);
    try {
      const res = await axios.get (`${BACKENDURL}/organzation/department/find?branchId=${id}`);
      setLoadingDepartment (false);
      setDepartmentData (res.data.departments);
    } catch (error) {
      openNotification ('error', error.response.data.message, 3, 'red');
      setLoadingDepartment (false);
    }
  };

  const departmentOptions = departmentData.length
    ? departmentData.map (department => ({
        value: department.id,
        label: department.name,
      }))
    : [];

  useEffect (() => {
    getDepartmentData (branchId);
  }, [branchId]);

  const [positionData, setPositionData] = useState ([]);
  const [loadingPosition, setLoadingPosition] = useState (false);
  const [positionId, setPositionId] = useState ('');

  const getPositionData = async (id) => {
    setLoadingPosition (true);
    form.resetFields (['position']);
    try {
      const res = await axios.get (`${BACKENDURL}/organzation/position/find?departmentId=${id}`);
      setLoadingPosition (false);
      setPositionData (res.data.positions);
    } catch (error) {
      openNotification ('error', error.response.data.message, 3, 'red');
      setLoadingPosition (false);
    }
  };

  const positionOptions = positionData.length
    ? positionData.map (position => ({
        value: position.id,
        label: position.name,
      }))
    : [];

  useEffect(() => {
    getPositionData (departmentId);
  }, [departmentId]);

  const [articles, setArticles] = useState ([
    {
      articleTitle: '',
      description: '',
    },
  ]);

  const handleAdd = () => {
    setArticles ([
      ...articles,
      {
        articleTitle: '',
        description: '',
      },
    ]);
  };

  const handleRemove = index => {
    setArticles (articles.filter ((_, i) => i !== index));
  };

  const onFinish = async values => {
    setLoading (true);
    try {
      const res = await axios.post (`${BACKENDURL}/employee/agreement/update`, {
        position: values.position,
        title: values.title,
        articles: articles,
        id:id
      });
      reload ();
      setLoading (false);
      openModalFun (false);
      openNotification ('success', res.data.message, 3, 'green');
      form.resetFields ();
    } catch (error) {
      setLoading (false);
      openNotification ('error', error.response.data.message, 3, 'red');
    }
  };
  const onFinishFailed = errorInfo => {
    console.log ('Failed:', errorInfo);
  };


  const [agreementData,setagreementData]=useState([])

  const getagreementData=async()=>{
    try {
      const res = await axios.get(`${BACKENDURL}/employee/agreement/detail?id=${id}`);
      setagreementData(res.data.agreement)
      setArticles(res.data.articles.map(question => ({
        name: question.name, 
        description: question.description,
      })))
    } catch (error) {
      openNotification('error', error.response.data.message, 3, 'red');
    }
  }

  useEffect(()=>{
    getagreementData()

    return setagreementData([])
  },[id])
  return (
    <div>
    {Object.keys(agreementData).length > 0 ? (
    <Form
      layout="vertical"
      onFinish={onFinish}
      form={form}
      onFinishFailed={onFinishFailed}
      initialValues={agreementData}
      disabled={loading}
      autoComplete="on"
      autoFocus="true"
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
<Form.Item
          style={{margin: '5px 0', width: '34%'}}
          label="Branch"
          rules={[
            {
              required: true,
              message: 'Please input Branch',
            },
          ]}
          name="branch"
        >
          <Select
            placeholder="Search to Select"
            onChange={(e)=>setBranchId(e)}
            options={branchOptions}
            loading={loadingBranch}
            disabled={loadingBranch}
          />
        </Form.Item>

        <Form.Item
          style={{margin: '5px 0', width: '25%'}}
          label="Department"
          rules={[
            {
              required: true,
              message: 'Please input Department',
            },
          ]}
          name="department"
        >
          <Select
            onChange={(e)=>setDepartmentId(e)}
            placeholder="Search to Select"
            options={departmentOptions}
            loading={loadingDepartment}
            disabled={loadingDepartment}
          />
        </Form.Item>
        <Form.Item
          style={{margin: '5px 0', width:'35%'}}
          label="Position"
          rules={[
            {
              required: true,
              message: 'Please input Position',
            },
          ]}
          name="position"
        >
          <Select
            placeholder="Search to Select"
            onChange={(e)=>setPositionId(e)}
            options={positionOptions}
            loading={loadingPosition}
            disabled={loadingPosition}
          />
        </Form.Item>
        <Form.Item
          style={{margin: '5px', width: '100%'}}
          label="Agreement Title"
          rules={[
            {
              required: true,
              message: 'Please input Title',
            },
          ]}
          name="title"
        >
          <Input />
        </Form.Item>
        {articles.map ((article, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              width: '100%',
              borderBottom: '1px solid gray',
              padding: '5px 0',
            }}
          >
            <Form.Item
              style={{margin: '0', width: '100%'}}
              label={`Article Name ${index + 1}`}
              rules={[{required: true, message: 'Article Name Required'}]}
            >
              <Input
                placeholder="Right of Employee"
                value={article.name}
                onChange={e => {
                  const value = e.target.value;
                  setArticles (prev => {
                    const updatedarticles = [...prev];
                    updatedarticles[index].name = value;
                    return updatedarticles;
                  });
                }}
              />
            </Form.Item>
            <Form.Item
              style={{margin: '0', width: '100%'}}
              label="Description"
              rules={[{required: true, message: 'Description Required'}]}
            >

              <TextArea
                value={article.description}
                onChange={e => {
                  const value = e.target.value;
                  setArticles (prev => {
                    const updatedarticles = [...prev];
                    updatedarticles[index].description = value;
                    return updatedarticles;
                  });
                }}
              />
            </Form.Item>

            {index > 0 &&
              <Button
                style={{marginTop: '5px'}}
                onClick={() => handleRemove (index)}
              >
                Remove
              </Button>}
          </div>
        ))}
        <Button style={{margin: '10px 0'}} type="primary" onClick={handleAdd}>
          Add article
        </Button>

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
    </Form>): (
      <p>Loading Agreement data...</p>
    )}
    </div>
  );
};

export default UpdateAgreementForm;
