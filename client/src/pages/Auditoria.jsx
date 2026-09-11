import React from 'react';
import AuditDashboard from '../components/AuditDashboard';
import '../styles/users.css';

const Auditoria = () => {
    return (
        <div className="main-container">
            <div className="table-wrapper">
                <div className="top-table">
                    <h1 className="title-table">Sistema de Auditoría</h1>
                </div>

                <AuditDashboard />
            </div>
        </div>
    );
};

export default Auditoria;
