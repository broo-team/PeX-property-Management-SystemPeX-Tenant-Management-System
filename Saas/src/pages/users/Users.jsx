import React, { useContext, useEffect, useState } from 'react'
import { AlertContext } from '../../context/AlertContext';
import axios from 'axios';
import ModalForm from '../../modal/Modal';
import { Button } from 'antd';
import UserTable from '../../components/tables/UserTable';
import { BACKENDURL } from '../../helper/Urls';
import NewUserForm from '../../components/forms/users/NewUserForm';

const Users = () => {
  const {openNotification} = useContext(AlertContext);

  const [userData,setUserData]=useState([])
  const [loading,setLoading]=useState(false)

  const getUserData=async()=>{
    setLoading(true)
    try {
      const res = await axios.get(`${BACKENDURL}/users/all`);
      setLoading (false);
      setUserData(res.data.users)
    } catch (error) {
      openNotification('error', error.response.data.message, 3, 'red');
      setLoading (false);
    }
  }

  useEffect(()=>{
    getUserData()
  },[])


  const [modalOpen, setModalOpen] = useState (false);
  const [modalTitle, setModalTitle] = useState ('');
  const [modalContent, setModalContent] = useState ([]);

  return (
    <div>
      <div style={{height: '50px',display:'flex',gap:'10px'}}>
        <Button type="primary" onClick={() => {setModalOpen (true);setModalContent(<NewUserForm reload={()=>getUserData()} openModalFun={(e) => setModalOpen (e)}/>);setModalTitle("New User")}}>
          Add New User
        </Button>
        <Button type='default' onClick={getUserData} loading={loading}>
          Reload
        </Button>
        <ModalForm
          open={modalOpen}
          close={() => setModalOpen (false)}
          title={modalTitle}
          content={modalContent}
        />
      </div>
      <UserTable loading={loading} reload={()=>getUserData()} userData={userData}/>
    </div>
  )
}

export default Users