import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, message, Popconfirm } from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";

const VacancyPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [file, setFile] = useState(null); // File state for uploads
  const [editService, setEditService] = useState(null); // Selected service to edit
  const [form] = Form.useForm();

  // Fetch services
  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/posts/services");
      setServices(response.data);
    } catch (error) {
      message.error("Failed to fetch services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Handle service creation
  const createService = async (values) => {
    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("description", values.description);
    if (file) formData.append("photo", file);
    formData.append("whychooseus", JSON.stringify([{ description: values.whychooseus }]));

    try {
      await axios.post("http://localhost:5000/api/posts/create/service", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      message.success("Service added successfully");
      setIsModalOpen(false);
      form.resetFields();
      resetFileInput();
      fetchServices();
    } catch (error) {
      message.error("Failed to add service");
    }
  };

  // Handle service update
  const updateService = async (values) => {
    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("description", values.description);
    if (file) formData.append("photo", file);
    formData.append("whychooseus", JSON.stringify([{ description: values.whychooseus }]));

    try {
      await axios.put(`http://localhost:5000/api/posts/update/service/${editService.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      message.success("Service updated successfully");
      setIsEditModalOpen(false);
      fetchServices();
    } catch (error) {
      message.error("Failed to update service");
    }
  };

  // Handle file selection
  const handleImageChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      form.setFieldsValue({ photo: uploadedFile }); // Update form's photo field
    }
  };

  // Reset file input
  const resetFileInput = () => {
    setFile(null);
    form.setFieldsValue({ photo: null }); // Reset photo field in the form
  };

  // Handle "Add Service" button click
  const handleAdd = () => {
    setIsModalOpen(true);
    setEditService(null);
    form.resetFields();
    resetFileInput();
  };

  // Handle "Edit Service" button click
  const handleEdit = (service) => {
    setEditService(service);
    setIsEditModalOpen(true);
    form.setFieldsValue({
      title: service.title,
      description: service.description,
      whychooseus: service.whychooseus?.[0]?.description || "",
    });
    resetFileInput();
  };

  // Handle service deletion
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/posts/delete/service/${id}`);
      message.success("Service deleted successfully");
      fetchServices();
    } catch (error) {
      message.error("Failed to delete service");
    }
  };

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Photo",
      dataIndex: "photo",
      key: "photo",
      render: (text) =>
        text ? (
          <img
            src={`http://localhost:5000/uploads/${text}`}
            alt="Service"
            style={{ width: 100, height: 100, objectFit: "cover" }}
          />
        ) : (
          "No Image"
        ),
    },
    {
      title: "Why Choose Us",
      dataIndex: "whychooseus",
      render: (whychooseus) =>
        whychooseus.map((item) => item.description).join(", "),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "date",
      render: (date) => dayjs(date).format("MMMM D, YYYY h:mm A"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this service?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger>
              Delete
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Service
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={services}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title="Add Service"
        visible={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          resetFileInput();
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Add"
      >
        <Form form={form} layout="vertical" onFinish={createService}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Please enter the title" }]}
          >
            <Input placeholder="Enter title" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Please enter the description" }]}
          >
            <Input.TextArea rows={4} placeholder="Enter description" />
          </Form.Item>
          <Form.Item
            name="photo"
            label="Photo"
            rules={[
              { required: true, message: "Please upload an image" },
              { validator: (_, value) => (file ? Promise.resolve() : Promise.reject('Please upload an image')) },
            ]}
          >
            <div style={{ marginBottom: 16 }}>
              {file ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  style={{ width: 100, height: 100, objectFit: "cover" }}
                />
              ) : (
                <div>No image selected</div>
              )}
            </div>
            <Button icon={<UploadOutlined />}>
              <input
                type="file"
                onChange={handleImageChange}
                accept="image/*"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  opacity: 0,
                  width: "100%",
                  height: "100%",
                  cursor: "pointer",
                }}
              />
              Select Image
            </Button>
          </Form.Item>
          <Form.Item
            name="whychooseus"
            label="Why Choose Us"
            rules={[{ required: true, message: "Please enter a reason for choosing" }]}
          >
            <Input placeholder="Enter reason" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      
      <Modal
  title="Edit Service"
  visible={isEditModalOpen}
  onCancel={() => {
    setIsEditModalOpen(false);
    resetFileInput();
  }}
  onOk={() => form.submit()}
  okText="Update"
>
  <Form form={form} layout="vertical" onFinish={updateService}>
    <Form.Item
      name="title"
      label="Title"
      rules={[{ required: true, message: "Please enter the title" }]}
    >
      <Input placeholder="Enter title" />
    </Form.Item>
    <Form.Item
      name="description"
      label="Description"
      rules={[{ required: true, message: "Please enter the description" }]}
    >
      <Input.TextArea rows={4} placeholder="Enter description" />
    </Form.Item>
    <Form.Item name="photo" label="Photo">
      <div style={{ marginBottom: 16 }}>
        {/* Show existing image if there is one */}
        {file ? (
          <img
            src={URL.createObjectURL(file)}
            alt="Preview"
            style={{ width: 100, height: 100, objectFit: "cover" }}
          />
        ) : editService?.photo ? (
          <img
            src={`http://localhost:5000/uploads/${editService.photo}`}
            alt="Service"
            style={{ width: 100, height: 100, objectFit: "cover" }}
          />
        ) : (
          <div>No image selected</div>
        )}
      </div>
      <Button icon={<UploadOutlined />}>
        <input
          type="file"
          onChange={handleImageChange}
          accept="image/*"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            opacity: 0,
            width: "100%",
            height: "100%",
            cursor: "pointer",
          }}
        />
        Select Image
      </Button>
    </Form.Item>
    <Form.Item
      name="whychooseus"
      label="Why Choose Us"
      rules={[{ required: true, message: "Please enter a reason for choosing" }]}
    >
      <Input placeholder="Enter reason" />
    </Form.Item>
  </Form>
</Modal>
    </>
  );
};

export default VacancyPage;



// import React, { useState } from "react";
// import axios from "axios";

// const Service = () => { 
//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [photo, setPhoto] = useState(null);
//   const [whyChooseUs, setWhyChooseUs] = useState([{ description: "" }]);
//   const [responseMessage, setResponseMessage] = useState("");

//   const handleWhyChooseUsChange = (index, value) => {
//     const updatedWhyChooseUs = [...whyChooseUs];
//     updatedWhyChooseUs[index].description = value;
//     setWhyChooseUs(updatedWhyChooseUs);
//   };

//   const addWhyChooseUsField = () => {
//     setWhyChooseUs([...whyChooseUs, { description: "" }]);
//   };

//   const removeWhyChooseUsField = (index) => {
//     const updatedWhyChooseUs = [...whyChooseUs];
//     updatedWhyChooseUs.splice(index, 1);
//     setWhyChooseUs(updatedWhyChooseUs);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const formData = new FormData();
//     formData.append("title", title);
//     formData.append("description", description);
//     formData.append("photo", photo);
//     formData.append(
//       "whychooseus",
//       JSON.stringify(whyChooseUs) // Send nested array as JSON string
//     );

//     try {
//       const response = await axios.post(
//         "http://localhost:5000/api/posts/create/service",
//         formData,
//         {
//           headers: { "Content-Type": "multipart/form-data" },
//         }
//       );
//       setResponseMessage("Service created successfully!");
//       console.log("Response:", response.data);
//     } catch (error) {
//       setResponseMessage("Error creating service.");
//       console.error(error);
//     }
//   };

//   return (
//     <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
//       <h2>Create a New Service</h2>
//       <form onSubmit={handleSubmit} encType="multipart/form-data">
//         <div>
//           <label>Title:</label>
//           <input
//             type="text"
//             value={title}
//             onChange={(e) => setTitle(e.target.value)}
//             required
//             style={{ display: "block", marginBottom: "10px", width: "100%" }}
//           />
//         </div>
//         <div>
//           <label>Description:</label>
//           <textarea
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//             required
//             style={{ display: "block", marginBottom: "10px", width: "100%" }}
//           />
//         </div>
//         <div>
//           <label>Photo:</label>
//           <input
//             type="file"
//             onChange={(e) => setPhoto(e.target.files[0])}
//             required
//             style={{ display: "block", marginBottom: "10px" }}
//           />
//         </div>
//         <div>
//           <label>Why Choose Us:</label>
//           {whyChooseUs.map((item, index) => (
//             <div key={index} style={{ marginBottom: "10px" }}>
//               <input
//                 type="text"
//                 value={item.description}
//                 onChange={(e) => handleWhyChooseUsChange(index, e.target.value)}
//                 placeholder={Reason ${index + 1}}
//                 style={{
//                   width: "calc(100% - 50px)",
//                   marginRight: "10px",
//                   marginBottom: "5px",
//                 }}
//               />
//               {index > 0 && (
//                 <button
//                   type="button"
//                   onClick={() => removeWhyChooseUsField(index)}
//                   style={{ padding: "5px", backgroundColor: "red", color: "white" }}
//                 >
//                   Remove
//                 </button>
//               )}
//             </div>
//           ))}
//           <button
//             type="button"
//             onClick={addWhyChooseUsField}
//             style={{ padding: "10px", marginTop: "10px" }}
//           >
//             Add More
//           </button>
//         </div>
//         <button
//           type="submit"
//           style={{
//             padding: "10px 20px",
//             marginTop: "20px",
//             backgroundColor: "#4CAF50",
//             color: "white",
//           }}
//         >
//           Create Service
//         </button>
//       </form>
//       {responseMessage && <p style={{ marginTop: "20px" }}>{responseMessage}</p>}
//     </div>
//   );
// };

// export default Service