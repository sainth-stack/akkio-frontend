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
    Checkbox,
    Card,
    Row,
    Col
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import { adminUrl } from '../../../utils/const';

const Roles = () => {
    const [roles, setRoles] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [selectAll, setSelectAll] = useState(false);

    const screenPermissions = {
        home: ['read', 'write'],
        projects: ['read', 'write'],
        connect: ['read', 'write'],
        discover: ['read', 'write'],
        forecast: ['read', 'write'],
        predict: ['read', 'write'],
        reports: ['read', 'write'],
        genAi: ['read', 'write'],
        dashboard: ['read', 'write'],
        settings: ['read', 'write']
    };

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${adminUrl}/roles`);
            const dataWithIndex = response.data.map((role, index) => ({
                ...role,
                key: role._id,
                sno: index + 1
            }));
            setRoles(dataWithIndex);
        } catch (error) {
            message.error('Failed to fetch roles');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    // Handle create/edit
    const handleSubmit = async (values) => {
        setSubmitLoading(true);
        try {
            // Transform permissions from form data to array format
            const permissions = [];
            Object.entries(values.permissions || {}).forEach(([screen, perms]) => {
                Object.entries(perms).forEach(([action, enabled]) => {
                    if (enabled) {
                        permissions.push(`${screen}_${action}`);
                    }
                });
            });

            const payload = {
                name: values.name,
                permissions
            };

            if (editingId) {
                await axios.put(`${adminUrl}/roles/${editingId}`, payload);
                message.success('Role updated successfully');
            } else {
                await axios.post(`${adminUrl}/roles`, payload);
                message.success('Role created successfully');
            }
            setIsModalOpen(false);
            form.resetFields();
            setEditingId(null);
            fetchRoles();
        } catch (error) {
            message.error('Operation failed');
        } finally {
            setSubmitLoading(false);
        }
    };

    // Handle delete
    const handleDelete = async (id) => {
        try {
            await axios.delete(`${adminUrl}/role/${id}`);
            message.success('Role deleted successfully');
            fetchRoles();
        } catch (error) {
            message.error('Delete failed');
        }
    };

    const handleSelectAll = (checked) => {
        setSelectAll(checked);
        const allPermissions = {};
        Object.keys(screenPermissions).forEach(screen => {
            allPermissions[screen] = {
                read: checked,
                write: checked
            };
        });
        form.setFieldsValue({ permissions: allPermissions });
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
            title: 'Permissions Count',
            dataIndex: 'permissions',
            key: 'permissions',
            render: (permissions) => permissions?.length || 0,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <EditOutlined
                        onClick={() => {
                            setEditingId(record._id);
                            // Transform permissions array to form structure
                            const permissionsObj = {};
                            record.permissions.forEach(perm => {
                                const [screen, action] = perm.split('_');
                                if (!permissionsObj[screen]) {
                                    permissionsObj[screen] = {};
                                }
                                permissionsObj[screen][action] = true;
                            });
                            form.setFieldsValue({
                                name: record.name,
                                permissions: permissionsObj
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
                Create Role
            </Button>

            <Table
                columns={columns}
                dataSource={roles}
                loading={loading}
            />

            <Modal
                title={editingId ? 'Edit Role' : 'Create Role'}
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    form.resetFields();
                    setEditingId(null);
                }}
                footer={null}
                width={700}
            >
                <Form form={form} onFinish={handleSubmit} layout="vertical">
                    <Form.Item
                        name="name"
                        label="Role Name"
                        rules={[{ required: true }]}
                    >
                        <Input />
                    </Form.Item>

                    <div className="permissions-section">
                        <div style={{ textAlign: 'right', marginBottom: '8px' }}>
                            <Checkbox
                                checked={selectAll}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                            >
                                Select All Permissions
                            </Checkbox>
                        </div>
                        <div className="permissions-table">
                            <div className="table-header">
                                <div className="col screen-col">Screen</div>
                                <div className="col">Read</div>
                                <div className="col">Write</div>
                            </div>
                            {Object.entries(screenPermissions).map(([screen, actions]) => (
                                <div className="table-row" key={screen}>
                                    <div className="col screen-col">
                                        {screen.charAt(0).toUpperCase() + screen.slice(1)}
                                    </div>
                                    {actions.map(action => (
                                        <div className="col" key={action}>
                                            <Form.Item
                                                name={['permissions', screen, action]}
                                                valuePropName="checked"
                                                style={{ margin: 0 }}
                                            >
                                                <Checkbox />
                                            </Form.Item>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
                        <Button type="primary" htmlType="submit" loading={submitLoading}>
                            {editingId ? 'Update' : 'Submit'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            <style jsx>{`
                .permissions-section {
                    margin-top: 16px;
                }
                .permissions-table {
                    border: 1px solid #f0f0f0;
                    border-radius: 4px;
                }
                .table-header {
                    display: flex;
                    background-color: #fafafa;
                    border-bottom: 1px solid #f0f0f0;
                    font-weight: 500;
                }
                .table-row {
                    display: flex;
                    border-bottom: 1px solid #f0f0f0;
                }
                .table-row:last-child {
                    border-bottom: none;
                }
                .col {
                    padding: 4px 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 80px;
                }
                .screen-col {
                    flex: 1;
                    justify-content: flex-start;
                }
                .table-row:hover {
                    background-color: #fafafa;
                }
            `}</style>
        </div>
    );
};

export default Roles;