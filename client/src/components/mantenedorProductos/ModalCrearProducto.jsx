import React from 'react';

const ModalCrearProducto = ({ isOpen, onClose, materiasPrimas, productos = [], prodForm, setProdForm, handleCreateProduct }) => {
    if (!isOpen) return null;

    const mpNombre = materiasPrimas.find(m => String(m.id) === String(prodForm.materiaPrimaId))?.nombre;

    return (
        <div className="bg" onClick={onClose}>
            <div className="popup" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
                <button className="btn-close-x" onClick={onClose}>✕</button>
                <h2>Nuevo Producto Derivado</h2>
                <p className="popup-subtitle">
                    Materia Prima: <strong>{mpNombre}</strong>
                </p>

                <form onSubmit={handleCreateProduct}>
                    <div className="container_inputs">
                        <label>Nombre del Producto</label>
                        <input
                            placeholder="Ej: Filete Trim D, Carne Picada"
                            value={prodForm.nombre}
                            onChange={e => setProdForm({ ...prodForm, nombre: e.target.value })}
                            required
                        />
                    </div>

                    <div className="container_inputs">
                        <label>Tipo de Producto</label>
                        <select value={prodForm.tipo} onChange={e => setProdForm({ ...prodForm, tipo: e.target.value })}>
                            <option value="elaborado">Elaborado (Envasado)</option>
                            <option value="primario">Primario (Procesado)</option>
                        </select>
                    </div>

                    {prodForm.tipo === 'elaborado' && (() => {
                        const primarios = productos.filter(p => p.tipo === 'primario' && String(p.materiaPrimaId || p.materiaPrima?.id) === String(prodForm.materiaPrimaId));
                        return (
                            <div className="container_inputs">
                                <label>Origen de Rendimiento</label>
                                <select
                                    value={prodForm.origen}
                                    onChange={e => setProdForm({ ...prodForm, origen: e.target.value })}
                                    required
                                >
                                    <option value="">-- Seleccione Rendimiento --</option>
                                    {primarios.map(p => (
                                        <option key={p.id} value={p.nombre}>{p.nombre}</option>
                                    ))}
                                    {/* Permitir opción libre si necesitan agrupar orígenes, por ahora los forzamos a elegir uno primario */}
                                </select>
                            </div>
                        );
                    })()}

                    <div className="container_inputs">
                        <label>Calibres / Variantes (opcional, separados por coma)</label>
                        <input
                            value={prodForm.calibresStr}
                            onChange={e => setProdForm({ ...prodForm, calibresStr: e.target.value })}
                            placeholder="Ej: 100g, 200g, Standard"
                        />
                    </div>

                    <div className="popup-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-save">Crear Producto</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalCrearProducto;
