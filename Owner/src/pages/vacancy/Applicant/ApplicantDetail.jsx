import {Button, Descriptions, Image, Spin, Tag} from 'antd';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ModalForm from '../../../modal/Modal';
import InterviewApplicantsForm from '../../../components/forms/vacancy/InterviewApplicantsForm';
import { BACKENDURL } from '../../../helper/Urls';
import axios from 'axios';
import HireEmployee from '../../../components/forms/employee/HireEmployee';
import CheckEmployee from '../../../components/forms/employee/CheckEmployee';
import { FormatDay } from '../../../helper/FormateDay';

const ApplicantDetail = () => {
  const params=useParams()
  
  const [applicantData,setApplicantData]=useState([])
  const [loading,setLoading]=useState(false)

  const getApplicantData=async()=>{
    setLoading(true)
    try {
      const res = await axios.get(`${BACKENDURL}/vacancy/applicantdetail?id=${params.id}`);
      setLoading (false);
      setApplicantData(res.data.applicant)
    } catch (error) {
      // openNotification('error', error.response.data.message, 3, 'red');
      console.log(error)
      setLoading (false);
    }
  }

  useEffect(()=>{
    getApplicantData()
  },[])


  const EmployeeInfoData = [
    {key: '4', label: 'Full Name', children: applicantData.name},
    {key: '5', label: 'Date of Birth', children:FormatDay(applicantData.dateOfBirth)},
    {key: '6', label: 'Gender', children: applicantData.sex},
    {key: '8', label: 'Nationality', children:applicantData.nationality},
    {key: '12', label: 'Email', children:applicantData.email},
    {key: '13', label: 'Phone', children:applicantData.phone},
    {key: '7', label: 'CV',span:3,children:<Image alt='CV'/>},
    {key: '2', label: 'Position', children:applicantData.position},
    {key: '16', label: 'Status', children: <Tag color={applicantData.status==='Pending'?'processing':applicantData.status==="Hired"?'success':"volcano"}>{applicantData.status}</Tag>},
    {key: '15', label: 'Score', children: `${applicantData.score} out of ${applicantData.maxScore}`},
  ];

  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState();
  const [modalContentTitle, setModalContentTitle] = useState('');
  return (
    <div>
      {loading?<Spin/>:
      <>
      <div style={{display:'flex',gap:'10px',justifyContent:'flex-end',marginBottom:'5px'}}>
        <Button type='primary' danger onClick={() => {setModalOpen (true);setModalContentTitle('Check Status Form ');setModalContent(<CheckEmployee data={[]} reload={()=>getApplicantData()} openModalFun={(e)=>setModalOpen(e)}/>)}} >Check Status</Button>
        <Button disabled={!applicantData.interview|| applicantData.status!=='Pending'} onClick={() => {setModalOpen (true);setModalContentTitle('Interview Form '+applicantData.interview);setModalContent(<InterviewApplicantsForm id={applicantData.interview} reload={()=>getApplicantData()} openModalFun={(e)=>setModalOpen(e)} applicantId={applicantData.applicantId}/>)}} >Interview</Button>
        <Button disabled={!applicantData || applicantData.status==='Hired' || applicantData.status==='Fail'} type='primary' onClick={() => {setModalOpen (true);setModalContentTitle('Hire Applicant');setModalContent(<HireEmployee data={applicantData} reload={()=>getApplicantData()} openModalFun={(e)=>setModalOpen(e)}/>)}}>Hire</Button>
        <ModalForm
          open={modalOpen}
          close={() => setModalOpen (false)}
          title={modalContentTitle}
          content={modalContent}
        />
      </div>
      <Descriptions
        style={{width: '100%'}}
        column={{xs: 1, sm: 1}}
        bordered
        size="small"
        items={EmployeeInfoData}
      />
      </>}
    </div>
  );
};

export default ApplicantDetail;
