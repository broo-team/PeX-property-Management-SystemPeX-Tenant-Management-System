import React, {useContext, useState, useEffect} from 'react';
import axios from 'axios';
import {Upload, Button, Progress} from 'antd';
import {UploadOutlined} from '@ant-design/icons';
import {AlertContext} from '../context/AlertContext';
import {BACKENDURL} from './Urls';
import fileToDownload from '../assets/imgs/image.png';
import {TbCopyCheck} from 'react-icons/tb';

const ImportCSV = ({route,reload, openModalFun}) => {
  const {openNotification} = useContext (AlertContext);
  const [fileList, setFileList] = useState ([]);
  const [loading, setLoading] = useState (false);
  const [uploadProgress, setUploadProgress] = useState (0); // Track upload percentage
  const [processedCount, setProcessedCount] = useState (0); // Track processed employees
  const [totalEmployees, setTotalEmployees] = useState (0); // Total employees from CSV
  const [modalVisible, setModalVisible] = useState (false); // Modal visibility

  const handleChange = info => {
    setFileList (info.fileList);
  };

  const copyToClipboard = errors => {
    const errorText = errors
      .map (l => `Error: ${l.error}, at line: ${l.employee + 2}`)
      .join ('\n');
    navigator.clipboard
      .writeText (errorText)
      .then (() => {
        openNotification ('success', 'Copy to Clipboard.', 3, 'green');
      })
      .catch (err => {
        openNotification ('error', 'Failed to copy.', 3, 'red');
      });
  };

  const fetchProgress = async () => {
    try {
      const {data} = await axios.get (`${BACKENDURL}/upload/progress`);
      setProcessedCount (data.processedCount);
      setUploadProgress (
        Math.round (data.processedCount / data.totalEmployees * 100)
      );

      if (data.processedCount >= data.totalEmployees) {
        clearInterval (pollingInterval); // Stop polling
        setLoading (false);
        setModalVisible (false);

        if (data.errors.length > 0) {
          openNotification (
            'Error',
            <div
              style={{
                overflow: 'scroll',
                height: '400px',
                position: 'relative',
              }}
            >
              <Button
                icon={<TbCopyCheck />}
                onClick={() => copyToClipboard (data.errors)}
                style={{marginTop: '10px', position: 'absolute', right: 0}}
              >
                copy
              </Button>
              <p>Found {data.errors.length} Errors</p>
              {data.errors.map ((l, index) => (
                <p key={index}>
                  Error: {l.error}, at line: {l.employee + 2}
                </p>
              ))}
            </div>,
            1000,
            'orange'
          );
        } else {
          openNotification (
            'success',
            'File uploaded successfully.',
            3,
            'green'
          );
        }

        setTotalEmployees (0);
        setProcessedCount (0);
        reload ();
        openModalFun(false)
        setFileList ([]);
      }
    } catch (error) {
      console.error ('Error fetching progress:', error);
      clearInterval (pollingInterval); // Stop polling
      setLoading (false);
      setModalVisible (false);
      openNotification ('error', 'Error fetching progress.', 10, 'red');
    }
  };

  let pollingInterval;

  const handleUpload = async () => {
    if (fileList.length === 0) {
      openNotification ('error', 'Please upload a CSV file.', 3, 'red');
      return;
    }

    setLoading (true);
    setUploadProgress (0);
    setModalVisible (true);

    const formData = new FormData ();
    formData.append ('file', fileList[0].originFileObj);

    try {
      const {
        data,
      } = await axios.post (`${BACKENDURL}/upload/csv/${route}`, formData, {
        headers: {'Content-Type': 'multipart/form-data'},
      });

      setTotalEmployees (data.totalEmployees); // Set total employees

      // Start polling every 1 second to fetch progress
      pollingInterval = setInterval (fetchProgress, 5000);
    } catch (error) {
      openNotification ('error', 'Upload failed', 10, 'red');
      setLoading (false);
      setModalVisible (false);
    }
  };

  useEffect (() => {
    // Cleanup polling interval on component unmount
    return () => clearInterval (pollingInterval);
  }, []);

  return (
    <div>
      <Upload.Dragger
        fileList={fileList}
        onChange={handleChange}
        beforeUpload={() => false}
      >
        <p className="ant-upload-drag-icon">
          <UploadOutlined />
        </p>
        <p className="ant-upload-text">Drag file here or click to upload</p>
      </Upload.Dragger>
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          marginTop: '20px',
        }}
      >

        <Button
          type="primary"
          onClick={handleUpload}
          disabled={loading || fileList.length === 0}
        >
          {loading ? '....' : `Upload ${route}`}
        </Button>
        <Button onClick={() => window.open (fileToDownload, '_blank')}>
          Download Sample File
        </Button>
      </div>

      <div style={{display: modalVisible ? 'block' : 'none'}}>
        <Progress percent={uploadProgress} />
        <p>{`Processed ${processedCount} out of ${totalEmployees}`}</p>
      </div>
    </div>
  );
};

export default ImportCSV;
