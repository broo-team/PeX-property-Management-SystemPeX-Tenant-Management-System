import React, { useContext, useEffect, useState } from 'react'
import VacancyApplicantTable from '../../../components/tables/vacancy/VacancyApplicantTable'
import { AlertContext } from '../../../context/AlertContext';
import { BACKENDURL } from '../../../helper/Urls';
import axios from 'axios';
import ModalForm from '../../../modal/Modal';
import { Button } from 'antd';
import NewApplicantForm from '../../../components/forms/vacancy/NewApplicantForm';
import { useParams } from 'react-router-dom';

const ApplicantList = () => {
  const {openNotification} = useContext(AlertContext);
  const [modalOpen, setModalOpen] = useState (false);
  const [vacancyApplicantData,setvacancyApplicantData]=useState([])
  const [loading,setLoading]=useState(false)
  const params=useParams()
  const getvacancyApplicantData=async()=>{
    setLoading(true)
    try {
      const res = await axios.get(`${BACKENDURL}/vacancy/applicants?id=${params.id}`);
      setLoading (false);
      setvacancyApplicantData(res.data.applicants)
    } catch (error) {
      openNotification('error', error.response.data.message, 3, 'red');
      setLoading (false);
    }
  }

  useEffect(()=>{
    getvacancyApplicantData()
  },[])

  return (
    <div>
      <div style={{height: '50px',display:'flex',gap:'10px'}}>
        <Button type="primary" onClick={() => setModalOpen (true)}>
          Add New Applicant
        </Button>
        <Button type='default' onClick={getvacancyApplicantData} loading={loading}>
          Reload
        </Button>
        <ModalForm
          open={modalOpen}
          close={() => setModalOpen (false)}
          title={'New Applicant Form'}
          content={<NewApplicantForm vacancyId={params.id} reload={()=>getvacancyApplicantData()} openModalFun={(e) => setModalOpen (e)}/>}
        />
      </div>
      <VacancyApplicantTable loading={loading} reload={()=>getvacancyApplicantData()} vacancyApplicantData={vacancyApplicantData}/>
    </div>
  )
}

export default ApplicantList