import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Button, message } from 'antd';
import { BACKENDURL } from '../../helper/Urls';
import ModalForm from '../../modal/Modal';
import NewReportForm from '../../components/forms/report/NewReportForm';
import ReportTable from '../../components/tables/report/ReportTable';

const ReportPage = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch report data from the backend
  const getReportData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKENDURL}/reports/reports`); // Adjust URL if needed
      console.log('Fetched Data:', res.data); // Check API response
      setReportData(res.data); // Directly set data if it's an array
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      message.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch report data when the component mounts
  useEffect(() => {
    getReportData();
  }, [getReportData]);

  return (
    <div>
      <div style={{ height: '50px', display: 'flex', gap: '10px' }}>
        <Button type="primary" onClick={() => setModalOpen(true)}>
          Add New Report
        </Button>
        <Button type="default" onClick={getReportData} loading={loading}>
          Reload
        </Button>
        <ModalForm
          open={modalOpen}
          close={() => setModalOpen(false)}
          title={'New Report Form'}
          content={<NewReportForm reload={getReportData} openModalFun={setModalOpen} />} // Pass the reload function to form
        />
      </div>
      {/* Pass the fetched report data and loading state to ReportTable */}
      <ReportTable loading={loading} datas={reportData} />
    </div>
  );
};

export default ReportPage;