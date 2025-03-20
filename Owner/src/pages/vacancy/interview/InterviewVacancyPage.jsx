import React, { useContext, useEffect, useState } from 'react'
import { AlertContext } from '../../../context/AlertContext';
import axios from 'axios';
import { BACKENDURL } from '../../../helper/Urls';
import InterviewVacancyTable from '../../../components/tables/vacancy/InterviewVacancyTable';

const InterviewVacancyPage = () => {
  const {openNotification} = useContext(AlertContext);

  const [vacancyData,setvacancyData]=useState([])
  const [loading,setLoading]=useState(false)

  const getvacancyData=async()=>{
    setLoading(true)
    try {
      const res = await axios.get(`${BACKENDURL}/vacancy/all`);
      setLoading (false);
      setvacancyData(res.data.vacancys)
    } catch (error) {
      openNotification('error', error.response.data.message, 3, 'red');
      setLoading (false);
    }
  }

  useEffect(()=>{
    getvacancyData()
  },[])



  return (
    <div>
      <div>Interview Title</div>
      <InterviewVacancyTable loading={loading} reload={()=>getvacancyData()} vacancyData={vacancyData}/>
    </div>
  )
}

export default InterviewVacancyPage