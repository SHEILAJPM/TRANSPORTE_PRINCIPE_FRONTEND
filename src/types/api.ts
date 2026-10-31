// Tipos espejo de los esquemas Pydantic del backend (app/schemas, app/models/enums.py).

export type RolUsuario = "ADMIN" | "OPERADOR" | "CONTABILIDAD" | "CHOFER";
export type TipoDocumentoIdentidad = "RUC" | "DNI";
export type EstadoCotizacion = "BORRADOR" | "ENVIADA" | "APROBADA" | "RECHAZADA" | "CONVERTIDA" | "VENCIDA";
export type ModalidadViaje = "CON_RUC" | "SIN_RUC";
export type EstadoViaje = "PROGRAMADO" | "EN_RUTA" | "FINALIZADO" | "LIQUIDADO" | "CANCELADO";
export type EstadoVehiculo = "OPERATIVO" | "EN_MANTENIMIENTO" | "INHABILITADO";
export type TipoCarreta = "SEMIRREMOLQUE" | "REMOLQUE";
export type TipoGastoViaje = "COMBUSTIBLE" | "PEAJE" | "VIATICO" | "ADELANTO" | "OTRO";
export type TipoMantenimiento = "PREVENTIVO" | "CORRECTIVO";
export type EstadoSunat = "PENDIENTE" | "ACEPTADO" | "RECHAZADO" | "ANULADO";
export type EstadoLiquidacion = "PENDIENTE" | "PAGADO";
export type CategoriaGastoGeneral =
  | "ALQUILER"
  | "SEGUROS"
  | "SUELDOS_ADMINISTRATIVOS"
  | "SERVICIOS"
  | "IMPUESTOS_Y_TASAS"
  | "OTRO";

export interface Usuario {
  id: string;
  empresa_id: string;
  nombres: string;
  apellidos: string;
  email: string;
  rol: RolUsuario;
  chofer_id: string | null;
  activo: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  usuario: Usuario;
}

export interface Empresa {
  id: string;
  ruc: string;
  razon_social: string;
  nombre_comercial: string | null;
  direccion_fiscal: string | null;
  distrito: string | null;
  provincia: string | null;
  departamento: string | null;
  telefono: string | null;
  email: string | null;
  logo_url: string | null;
  logo_actualizado_en: string | null;
  serie_factura_default: string | null;
  serie_guia_remision_default: string | null;
  numero_registro_mtc: string | null;
  cuenta_detracciones: string | null;
}

export interface Cliente {
  id: string;
  tipo_documento: TipoDocumentoIdentidad;
  numero_documento: string;
  razon_social: string;
  nombre_comercial: string | null;
  direccion: string | null;
  distrito: string | null;
  provincia: string | null;
  departamento: string | null;
  fuente_datos: string;
}

export interface Cotizacion {
  id: string;
  numero: string;
  empresa_id: string;
  cliente_id: string;
  usuario_id: string;
  descripcion_servicio: string;
  origen_direccion: string;
  origen_distrito: string;
  origen_provincia: string;
  origen_departamento: string;
  destino_direccion: string;
  destino_distrito: string;
  destino_provincia: string;
  destino_departamento: string;
  cantidad_camiones: number;
  peso_tm: number;
  precio_base: number;
  porcentaje_igv: number;
  monto_igv: number;
  precio_total: number;
  condiciones_comerciales: string;
  validez_dias: number;
  estado: EstadoCotizacion;
  fecha_emision: string;
  convertida_en: string | null;
  cliente?: Cliente;
}

export interface DocumentoGenerado {
  id: string;
  numero: string;
}

export interface ResultadoConversion {
  viaje: DocumentoGenerado;
  guia_remision: DocumentoGenerado;
  constancia_pesos_medidas: DocumentoGenerado;
}

export interface Tracto {
  id: string;
  placa: string;
  marca: string;
  modelo: string | null;
  anio_fabricacion: number | null;
  largo_m: number;
  ancho_m: number;
  alto_m: number;
  configuracion_vehicular: string;
  numero_ejes: number | null;
  tara_kg: number | null;
  peso_bruto_max_kg: number;
  kilometraje_actual: number;
  estado: EstadoVehiculo;
  soat_vencimiento: string | null;
  citv_vencimiento: string | null;
  mtc_habilitacion_vencimiento: string | null;
  tarjeta_unica_circulacion: string | null;
}

export interface Carreta {
  id: string;
  placa: string;
  tipo_carreta: TipoCarreta;
  marca: string | null;
  modelo: string | null;
  anio_fabricacion: number | null;
  largo_m: number;
  ancho_m: number;
  alto_m: number;
  configuracion_vehicular: string;
  numero_ejes: number | null;
  tara_kg: number | null;
  peso_bruto_max_kg: number;
  kilometraje_actual: number;
  estado: EstadoVehiculo;
  soat_vencimiento: string | null;
  citv_vencimiento: string | null;
  mtc_habilitacion_vencimiento: string | null;
  tarjeta_unica_circulacion: string | null;
}

export interface Chofer {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  licencia_numero: string;
  licencia_categoria: string;
  licencia_vencimiento: string;
  activo: boolean;
  tarifa_diaria_default: number;
  bono_nocturno_default: number;
}

export interface Viaje {
  id: string;
  numero: string;
  cliente_id: string;
  modalidad: ModalidadViaje;
  tracto_id: string;
  carreta_id: string | null;
  chofer_id: string;
  origen_direccion: string;
  origen_distrito: string;
  origen_provincia: string;
  origen_departamento: string;
  origen_ubigeo: string | null;
  destino_direccion: string;
  destino_distrito: string;
  destino_provincia: string;
  destino_departamento: string;
  destino_ubigeo: string | null;
  peso_tm: number;
  fecha_salida_programada: string;
  fecha_salida_real: string | null;
  fecha_llegada_real: string | null;
  dias_viaje: number;
  noches_viaje: number;
  tarifa_diaria_chofer: number;
  bono_nocturno_chofer: number;
  ingreso_flete_neto: number;
  estado: EstadoViaje;
  observaciones: string | null;
  cliente?: Cliente;
  tracto?: Tracto;
  carreta?: Carreta | null;
  chofer?: Chofer;
}

export interface ResultadoActivacion {
  viaje: DocumentoGenerado;
  guia_remision: DocumentoGenerado;
  constancia_pesos_medidas: DocumentoGenerado;
}

export interface GastoViaje {
  id: string;
  viaje_id: string;
  tipo_gasto: TipoGastoViaje;
  monto: number;
  fecha: string;
  galones: number | null;
  grifo_nombre: string | null;
  numero_ticket: string | null;
  descripcion: string | null;
  comprobante_url: string | null;
  uuid_dispositivo: string | null;
  sincronizado: boolean;
}

export interface NovedadViaje {
  id: string;
  viaje_id: string;
  tipo_novedad: string;
  descripcion: string;
  fecha: string;
  latitud: number | null;
  longitud: number | null;
  foto_url: string | null;
  resuelto: boolean;
  uuid_dispositivo: string | null;
}

export interface Liquidacion {
  dias_viaje: number;
  noches_viaje: number;
  tarifa_diaria: number;
  bono_nocturno: number;
  monto_dietas: number;
  total_adelantos_recibidos: number;
  total_gastos_operativos: number;
  saldo_rendicion_cuentas: number;
  neto_a_pagar_chofer: number;
  estado: EstadoLiquidacion;
}

export interface Rentabilidad {
  ingresos_netos_flete: number;
  total_gastos_operativos: number;
  monto_dietas_chofer: number;
  egresos_totales: number;
  ganancia_neta: number;
}

export interface GuiaRemision {
  id: string;
  viaje_id: string;
  cliente_id: string;
  serie: string;
  numero: string;
  fecha_emision: string;
  motivo_traslado: string;
  peso_bruto_total_kg: number;
  numero_bultos: number | null;
  modalidad_transporte: string;
  remitente_guia_ruc_emisor: string | null;
  remitente_guia_serie: string | null;
  remitente_guia_numero: string | null;
  destinatario_tipo_documento: string | null;
  destinatario_numero_documento: string | null;
  destinatario_razon_social: string | null;
  bienes: BienGuia[] | null;
  estado_sunat: EstadoSunat;
  hash_cpe: string | null;
  xml_url: string | null;
  cdr_url: string | null;
  pdf_url: string | null;
  mensaje_sunat: string | null;
  sunat_ticket: string | null;
  sunat_codigo_respuesta: string | null;
  enviado_sunat_en: string | null;
  xml_firmado_disponible: boolean;
  cdr_disponible: boolean;
}

export interface BienGuia {
  descripcion: string;
  cantidad: number;
  unidad: string;
  codigo: string | null;
}

/** Parte de una guía: tipo_documento según Catálogo 06 de SUNAT ("6" RUC, "1" DNI). */
export interface ParteGuia {
  tipo_documento: string;
  numero_documento: string;
  razon_social: string;
}

export interface PuntoGuia {
  ubigeo: string | null;
  direccion: string | null;
}

export interface GuiaRemitenteImportada {
  cliente: Cliente;
  remitente_guia_ruc_emisor: string;
  remitente_guia_serie: string;
  remitente_guia_numero: string;
  fecha_emision_guia: string | null;
  destinatario: ParteGuia | null;
  origen: PuntoGuia;
  destino: PuntoGuia;
  peso_tm: number | null;
  numero_bultos: number | null;
  fecha_inicio_traslado: string | null;
  motivo_traslado: string | null;
  bienes: BienGuia[];
  advertencias: string[];
}

/** Datos exactos que se enviarán a SUNAT (espejo de DatosGuiaTransportista del backend). */
export interface DatosGuiaTransportista {
  serie: string;
  numero: string;
  transportista: ParteGuia;
  registro_mtc: string | null;
  remitente: ParteGuia;
  destinatario: ParteGuia;
  partida: { ubigeo: string; direccion: string };
  llegada: { ubigeo: string; direccion: string };
  fecha_inicio_traslado: string;
  peso_bruto_kg: string;
  vehiculo_principal: { placa: string; tarjeta_unica_circulacion: string | null };
  vehiculos_secundarios: { placa: string; tarjeta_unica_circulacion: string | null }[];
  conductor: { dni: string; nombres: string; apellidos: string; licencia: string };
  bienes: { descripcion: string; cantidad: string; unidad: string; codigo: string | null }[];
  documentos_relacionados: { tipo: string; serie: string; numero: string; ruc_emisor: string }[];
  observaciones: string | null;
}

export interface GuiaVistaPrevia {
  huella: string;
  proveedor: "sunat_directo" | "apisunat";
  puede_emitir: boolean;
  errores: string[];
  advertencias: string[];
  datos: DatosGuiaTransportista;
  xml: string | null;
}

export interface Factura {
  id: string;
  viaje_id: string | null;
  cliente_id: string;
  guia_remision_id: string | null;
  documento_afectado_id: string | null;
  tipo_documento: "FACTURA" | "BOLETA" | "NOTA_CREDITO";
  serie: string;
  numero: string;
  fecha_emision: string;
  moneda: string;
  subtotal: number;
  igv: number;
  total: number;
  precio_incluye_igv: boolean | null;
  detraccion_porcentaje: number | null;
  detraccion_monto: number | null;
  detraccion_cuenta: string | null;
  receptor_tipo_documento: string | null;
  receptor_numero_documento: string | null;
  receptor_razon_social: string | null;
  descripcion: string | null;
  estado_sunat: EstadoSunat;
  hash_cpe: string | null;
  xml_url: string | null;
  cdr_url: string | null;
  pdf_url: string | null;
  mensaje_sunat: string | null;
  enviado_en: string | null;
}

export type TipoComprobanteVenta = "FACTURA" | "BOLETA";
/** CLIENTE = a nombre del cliente del viaje; SIN_DOCUMENTO = boleta a "CLIENTES VARIOS" (< S/ 700). */
export type ReceptorComprobante = "CLIENTE" | "SIN_DOCUMENTO";

export interface ComprobanteBorrador {
  tipo_sugerido: TipoComprobanteVenta;
  cliente: Cliente;
  precio_sugerido: number | null;
  precio_incluye_igv: boolean;
  origen_precio: "COTIZACION" | "FLETE_ESTIMADO" | null;
  descripcion_sugerida: string;
  guia_remision: string | null;
  guia_estado_sunat: EstadoSunat | null;
  porcentaje_igv: number;
  limite_boleta_sin_documento: number;
  porcentaje_detraccion: number;
  monto_minimo_detraccion: number;
  cuenta_detracciones: string | null;
  puede_emitir: boolean;
  bloqueos: string[];
}

export interface EntradaComprobante {
  tipo_documento: TipoComprobanteVenta;
  precio: number;
  precio_incluye_igv: boolean;
  receptor: ReceptorComprobante;
  descripcion?: string | null;
}

export interface ComprobanteVistaPrevia {
  huella: string;
  puede_emitir: boolean;
  errores: string[];
  advertencias: string[];
  tipo_documento: TipoComprobanteVenta;
  serie: string;
  receptor_tipo_documento: string;
  receptor_numero_documento: string;
  receptor_razon_social: string;
  descripcion: string;
  precio_incluye_igv: boolean;
  subtotal: number;
  igv: number;
  total: number;
  porcentaje_igv: number;
  detraccion_aplica: boolean;
  detraccion_porcentaje: number;
  detraccion_monto: number;
  /** Lo que el cliente paga directamente: total − detracción. */
  neto_a_cobrar: number;
  detraccion_nota: string;
  detraccion_cuenta: string | null;
  guia_remision: string | null;
}

export interface ConstanciaPesosMedidas {
  id: string;
  numero: string;
  guia_remision_id: string;
  viaje_id: string;
  tracto_id: string;
  carreta_id: string | null;
  chofer_id: string;
  generador_carga_cliente_id: string;
  tipo_control: string;
  lugar_verificacion: string | null;
  fecha_verificacion: string;
  peso_bruto_kg: number;
  tara_kg: number;
  peso_neto_kg: number;
  precinto_seguridad: string | null;
  numero_licencia_chofer: string;
  largo_m: number;
  ancho_m: number;
  alto_m: number;
  configuracion_vehicular: string;
  peso_bruto_max_kg: number;
  observaciones: string | null;
}

export interface GastoGeneral {
  id: string;
  categoria: CategoriaGastoGeneral;
  descripcion: string;
  monto: number;
  fecha: string;
  proveedor: string | null;
  comprobante_url: string | null;
  registrado_por_usuario_id: string;
}

export interface ResumenFinanciero {
  ingresos_totales: number;
  egresos_operativos_viajes: number;
  dietas_choferes: number;
  mantenimiento_flota: number;
  egresos_generales: number;
  egresos_totales: number;
  ganancia_neta: number;
}

export interface GuiaRemisionListItem {
  id: string;
  viaje_id: string;
  viaje_numero: string;
  serie: string;
  numero: string;
  cliente_razon_social: string;
  fecha_emision: string;
  peso_bruto_total_kg: number;
  estado_sunat: EstadoSunat;
  mensaje_sunat: string | null;
  pdf_url: string | null;
}

export interface FacturaListItem {
  id: string;
  viaje_id: string | null;
  viaje_numero: string | null;
  documento_afectado_id: string | null;
  tipo_documento: "FACTURA" | "BOLETA" | "NOTA_CREDITO";
  serie: string;
  numero: string;
  cliente_razon_social: string;
  fecha_emision: string;
  moneda: string;
  total: number;
  estado_sunat: EstadoSunat;
  mensaje_sunat: string | null;
  pdf_url: string | null;
}

export interface ApiErrorBody {
  detail: string;
}
