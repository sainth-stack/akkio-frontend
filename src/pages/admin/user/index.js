import { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    Space,
    message,
    Popconfirm,
    Select
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import { adminUrl } from '../../../utils/const';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [roles, setRoles] = useState([]);

    // Fetch users
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${adminUrl}/users`);
            const dataWithIndex = response.data.map((user, index) => ({
                ...user,
                key: user._id,
                sno: index + 1
            }));
            setUsers(dataWithIndex);
        } catch (error) {
            message.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    // Fetch organizations for dropdown
    const fetchOrganizations = async () => {
        try {
            const response = await axios.get(`${adminUrl}/organizations`);
            setOrganizations(response.data);
        } catch (error) {
            message.error('Failed to fetch organizations');
        }
    };

    // Fetch roles
    const fetchRoles = async () => {
        try {
            const response = await axios.get(`${adminUrl}/roles`);
            setRoles(response.data);
        } catch (error) {
            message.error('Failed to fetch roles');
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchOrganizations();
        fetchRoles();
    }, []);

    // Handle create/edit
    const handleSubmit = async (values) => {
        setSubmitLoading(true);
        try {

            if (editingId) {
                await axios.put(`${adminUrl}/user/${editingId}`, {...values,app:'akkio'});
                message.success('User updated successfully');
            } else {
                await axios.post(`${adminUrl}/register`, {...values,app:'akkio'});
                message.success('User created successfully');
            }
            setIsModalOpen(false);
            form.resetFields();
            setEditingId(null);
            fetchUsers();
        } catch (error) {
            message.error('Operation failed');
        } finally {
            setSubmitLoading(false);
        }
    };

    // Handle delete
    const handleDelete = async (id) => {
        try {
            await axios.delete(`${adminUrl}/user/${id}`);
            message.success('User deleted successfully');
            fetchUsers();
        } catch (error) {
            message.error('Delete failed');
        }
    };

    const columns = [
        {
            title: 'S.No',
            dataIndex: 'sno',
            key: 'sno',
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Organization',
            dataIndex: ['organization', 'name'],
            key: 'organization',
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <EditOutlined
                        onClick={() => {
                            setEditingId(record._id);
                            form.setFieldsValue({
                                name: record.name,
                                email: record?.email,
                                organization: record?.organization?._id,
                                roles: record.roles.map(role => role._id)
                            });
                            setIsModalOpen(true);
                        }}
                    />
                    <Popconfirm
                        title="Are you sure?"
                        onConfirm={() => handleDelete(record._id)}
                    >
                        <DeleteOutlined />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                    setEditingId(null);
                    form.resetFields();
                    setIsModalOpen(true);
                }}
                style={{ marginBottom: '16px' }}
            >
                Create User
            </Button>

            <Table
                columns={columns}
                dataSource={users}
                loading={loading}
            />

            <Modal
                title={editingId ? 'Edit User' : 'Create User'}
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    form.resetFields();
                    setEditingId(null);
                }}
                footer={null}
            >
                <Form form={form} onFinish={handleSubmit} layout="vertical">
                    <Form.Item
                        name="name"
                        label="Name"
                        rules={[{ required: true }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true },
                            { type: 'email', message: 'Please enter a valid email' }
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    {(
                        <Form.Item
                            name="password"
                            label="Password"
                            rules={[{ required: true }]}
                        >
                            <Input.Password />
                        </Form.Item>
                    )}
                    <Form.Item
                        name="organization"
                        label="Organization"
                        rules={[{ required: true }]}
                    >
                        <Select>
                            {organizations.map(org => (
                                <Select.Option key={org._id} value={org._id}>
                                    {org.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="roles"
                        label="Roles"
                        rules={[{ required: true, message: 'Please select at least one role' }]}
                    >
                        <Select
                            mode="multiple"
                            placeholder="Select roles"
                            style={{ width: '100%' }}
                            options={roles.map(role => ({
                                label: role.name,
                                value: role._id
                            }))}
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitLoading}
                        >
                            {editingId ? 'Update' : 'Submit'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Users;