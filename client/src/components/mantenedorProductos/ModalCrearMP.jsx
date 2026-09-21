import React from 'react';

const ModalCrearMP = ({ isOpen, onClose, newMPName, setNewMPName, newMPRendimiento, setNewMPRendimiento, handleCreateMP }) => {
    if (!isOpen) return null;

    return (
        <div className="bg" onClick={onClose}>
            <div className="popup" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px' }}>
                <button className="btn-close-x" onClick={onClose}>✕</button>
                <h2>Nueva Materia Prima</h2>
                <form onSubmit={handleCreateMP}>
                    <div className="container_inputs">
                        <label>Nombre Categoría</label>
                        <input
                            autoFocus
                            placeholder="Ej: Salmón, Jibia, Jaiba, Pulpo"
                            value={newMPName}
                            onChange={e => setNewMPName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="container_inputs" style={{ marginTop: '14px' }}>
                        <label>Rendimiento Teórico Esperado (%)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="Ej: 45.00"
                            value={newMPRendimiento}
                            onChange={e => setNewMPRendimiento(e.target.value)}
                        />
                        <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block', marginTop: '4px' }}>
                            Porcentaje meta tras proceso y empaque. Déjalo en blanco si la empresa aún no lo define.
                        </span>
                    </div>
                    <div className="popup-actions" style={{ marginTop: '20px' }}>
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-save">Guardar Categoría</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalCrearMP;
