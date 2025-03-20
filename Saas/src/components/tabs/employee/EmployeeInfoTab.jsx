import {Button, Descriptions, Divider} from 'antd';
import React, { useState } from 'react';
import EditEmployee from '../../forms/employee/EditEmployee';
import ModalForm from '../../../modal/Modal';

const EmployeeInfoTab = ({data,id}) => {
  const [modalOpen, setModalOpen] = useState (false);
  return (
    <div>
      <ModalForm
          open={modalOpen}
          close={() => setModalOpen (false)}
          title={<Divider>Edit Employee Form {id}</Divider>}
          content={
            <EditEmployee formInfos={data} id={id} reload={()=>{}} openModalFun={(e) => setModalOpen (e)}/>
          }
        />
      <Descriptions
        style={{width: '100%'}}
        column={{xs: 1, sm: 1}}
        bordered
        size="small"
        items={data}
      />
      <Button style={{marginTop:'10px'}} onClick={() =>{setModalOpen (true)}} type='primary' >Edit Information</Button>
    </div>
  );
};

export default EmployeeInfoTab;
