import { jest } from '@jest/globals';

jest.unstable_mockModule('../../services/pedido.service.js', () => ({
  createPedidoService: jest.fn(),
  getPedidosService: jest.fn(),
  getPedidosForExport: jest.fn(),
  completarDespachoPedidoService: jest.fn(),
  deletePedidoService: jest.fn()
}));

jest.unstable_mockModule('../../handlers/responseHandlers.js', () => ({
  handleErrorClient: jest.fn(),
  handleErrorServer: jest.fn(),
  handleSuccess: jest.fn(),
}));

jest.unstable_mockModule('exceljs', () => ({
  default: {
    Workbook: jest.fn().mockImplementation(() => ({
      addWorksheet: jest.fn().mockReturnValue({
        columns: [],
        getRow: jest.fn().mockReturnValue({ font: {}, fill: {} }),
        addRow: jest.fn()
      }),
      xlsx: {
        writeBuffer: jest.fn().mockResolvedValue(Buffer.from('excel_data'))
      }
    }))
  }
}));

jest.unstable_mockModule('jspdf', () => ({
  default: {
    jsPDF: jest.fn().mockImplementation(() => ({
      setFontSize: jest.fn(),
      text: jest.fn(),
      autoTable: jest.fn(),
      output: jest.fn().mockReturnValue(new ArrayBuffer(8))
    }))
  }
}));

jest.unstable_mockModule('jspdf-autotable', () => ({
  default: jest.fn()
}));

const {
  createPedidoService,
  getPedidosService,
  getPedidosForExport,
  completarDespachoPedidoService,
  deletePedidoService
} = await import('../../services/pedido.service.js');

const { handleErrorClient, handleErrorServer, handleSuccess } = await import('../../handlers/responseHandlers.js');
const { 
  createPedido, getPedidos, exportPedidosToExcel, exportPedidosToPDF, completarDespacho, deletePedido 
} = await import('../../controllers/pedido.controller.js');

describe('Pedido Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      params: {},
      query: {},
      user: { email: 'admin@samar.cl', rol: 'administrador' }
    };
    res = {
      setHeader: jest.fn(),
      send: jest.fn()
    };
  });

  describe('createPedido', () => {
    it('debe devolver error de validacion', async () => {
      req.body = {}; // missing required fields
      await createPedido(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, 'Error de validación', expect.any(String));
    });

    it('debe crear exitosamente', async () => {
      req.body = {
        cliente: 'Cliente Test',
        numero_guia: 'G-123',
        items: [{ definicionProductoId: 1, peso_caja: 10, cantidad_bultos: 5 }]
      };
      createPedidoService.mockResolvedValue([{ id: 1 }, null]);
      await createPedido(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 201, 'Pedido registrado exitosamente', { id: 1 });
    });

    it('debe manejar error de servicio', async () => {
      req.body = {
        cliente: 'Cliente Test',
        numero_guia: 'G-123',
        items: [{ definicionProductoId: 1, peso_caja: 10, cantidad_bultos: 5 }]
      };
      createPedidoService.mockResolvedValue([null, 'Error inventario']);
      await createPedido(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, 'Error inventario');
    });

    it('debe manejar error de servidor', async () => {
      req.body = {
        cliente: 'Cliente Test',
        numero_guia: 'G-123',
        items: [{ definicionProductoId: 1, peso_caja: 10, cantidad_bultos: 5 }]
      };
      createPedidoService.mockRejectedValue(new Error('Crash'));
      await createPedido(req, res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, 'Crash');
    });
  });

  describe('getPedidos', () => {
    it('debe obtener pedidos', async () => {
      getPedidosService.mockResolvedValue([[{ id: 1 }], null]);
      await getPedidos(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Historial de pedidos obtenido', [{ id: 1 }]);
    });

    it('debe manejar error de servicio', async () => {
      getPedidosService.mockResolvedValue([null, 'Not found']);
      await getPedidos(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 404, 'Not found');
    });
  });

  describe('exportPedidosToExcel', () => {
    it('debe exportar excel exitosamente (sin productos y con productos)', async () => {
      getPedidosForExport.mockResolvedValue([
        [
          { id: 1, cliente: 'A', estado: 'CREADO', detalles: [] },
          { id: 2, cliente: 'B', estado: 'CREADO', detalles: [
            { producto: { definicion: { nombre: 'P1' } }, tipo_formato: 'C1', cantidad_bultos: 2, kilos_totales: 20 }
          ]}
        ], null
      ]);
      await exportPedidosToExcel(req, res);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(res.send).toHaveBeenCalled();
    });

    it('debe manejar error de servicio', async () => {
      getPedidosForExport.mockResolvedValue([null, 'Not found']);
      await exportPedidosToExcel(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 404, 'Not found');
    });
  });

  describe('exportPedidosToPDF', () => {
    it('debe exportar pdf exitosamente', async () => {
      getPedidosForExport.mockResolvedValue([
        [
          { id: 1, cliente: 'A', estado: 'CREADO', detalles: [] },
          { id: 2, cliente: 'B', estado: 'CREADO', detalles: [
            { producto: { definicion: { nombre: 'P1' } }, tipo_formato: 'C1', cantidad_bultos: 2, kilos_totales: 20 }
          ]}
        ], null
      ]);
      await exportPedidosToPDF(req, res);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.send).toHaveBeenCalled();
    });

    it('debe manejar error de servicio', async () => {
      getPedidosForExport.mockResolvedValue([null, 'Not found']);
      await exportPedidosToPDF(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 404, 'Not found');
    });
  });

  describe('completarDespacho', () => {
    it('debe devolver error de validacion', async () => {
      req.params = { id: 1 };
      req.body = { invalidField: true }; // schema forces cajasIds or cajaId
      await completarDespacho(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, expect.stringContaining('Error de validaci'), expect.any(String));
    });

    it('debe completar despacho con cajasIds', async () => {
      req.params = { id: 1 };
      req.body = { cajasIds: [1, 2], cerrarPedido: true };
      completarDespachoPedidoService.mockResolvedValue([{ id: 1 }, null]);
      await completarDespacho(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Despacho completado exitosamente', { id: 1 });
    });

    it('debe completar despacho con cajaId (barcode)', async () => {
      req.params = { id: 1 };
      req.body = { cajaId: 'CJ-00123' };
      completarDespachoPedidoService.mockResolvedValue([{ id: 1 }, null]);
      await completarDespacho(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Despacho completado exitosamente', { id: 1 });
    });

    it('debe manejar error de servicio', async () => {
      req.params = { id: 1 };
      req.body = { cajasIds: [1] };
      completarDespachoPedidoService.mockResolvedValue([null, 'Error de stock']);
      await completarDespacho(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, 'Error de stock');
    });
  });

  describe('deletePedido', () => {
    it('debe eliminar exitosamente', async () => {
      req.params = { id: 1 };
      deletePedidoService.mockResolvedValue([true, null]);
      await deletePedido(req, res);
      expect(handleSuccess).toHaveBeenCalledWith(res, 200, 'Pedido eliminado exitosamente', true);
    });

    it('debe manejar error de servicio', async () => {
      req.params = { id: 1 };
      deletePedidoService.mockResolvedValue([null, 'No se puede eliminar']);
      await deletePedido(req, res);
      expect(handleErrorClient).toHaveBeenCalledWith(res, 400, 'No se puede eliminar');
    });

    it('debe manejar error de servidor', async () => {
      req.params = { id: 1 };
      deletePedidoService.mockRejectedValue(new Error('Crash'));
      await deletePedido(req, res);
      expect(handleErrorServer).toHaveBeenCalledWith(res, 500, 'Crash');
    });
  });
});
