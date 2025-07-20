// Interfacce TypeScript per i dati Daikin
interface DaikinDevice {
  _id: string;
  deviceModel: string;
  managementPoints: ManagementPoint[];
  isCloudConnectionUp: {
    value: boolean;
  };
  timestamp: string;
}

interface ManagementPoint {
  embeddedId: string;
  managementPointType: string;
  name?: {
    value: string;
  };
  onOffMode?: {
    value: string;
  };
  operationMode?: {
    value: string;
  };
  powerfulMode?: {
    value: string;
  };
  sensoryData?: {
    value: {
      roomTemperature: { value: number; unit: string };
      roomHumidity: { value: number; unit: string };
      outdoorTemperature: { value: number; unit: string };
    };
  };
  temperatureControl?: {
    value: {
      operationModes: {
        cooling: {
          setpoints: {
            roomTemperature: { value: number; unit: string };
          };
        };
        heating: {
          setpoints: {
            roomTemperature: { value: number; unit: string };
          };
        };
        auto: {
          setpoints: {
            roomTemperature: { value: number; unit: string };
          };
        };
      };
    };
  };
  fanControl?: {
    value: {
      operationModes: {
        [key: string]: {
          fanSpeed?: {
            currentMode: { value: string };
          };
          fanDirection?: {
            horizontal: { currentMode: { value: string } };
            vertical: { currentMode: { value: string } };
          };
        };
      };
    };
  };
  consumptionData?: {
    value: {
      electrical: {
        unit: string;
        heating: {
          d: number[];
          w: number[];
          m: number[];
        };
        cooling: {
          d: number[];
          w: number[];
          m: number[];
        };
      };
    };
  };
  isInErrorState?: { value: boolean };
  isInWarningState?: { value: boolean };
  isInCautionState?: { value: boolean };
}

interface ParsedDaikinData {
  deviceId: string;
  deviceModel: string;
  isOnline: boolean;
  climateControls: Array<{
    id: string;
    name: string;
    isOn: boolean;
    mode: string;
    roomTemperature?: number;
    roomHumidity?: number;
    outdoorTemperature?: number;
    targetTemperature?: number;
    fanSpeed?: string;
    fanDirectionHorizontal?: string;
    fanDirectionVertical?: string;
    powerfulMode: boolean;
    isInErrorState: boolean;
    isInWarningState: boolean;
    isInCautionState: boolean;
    consumptionToday?: number;
    consumptionThisWeek?: number;
    consumptionThisMonth?: number;
  }>;
}

export class DaikinDataParser {
  static parseDevices(devices: any[]): ParsedDaikinData[] {
    return devices.map(device => this.parseDevice(device));
  }

  static parseDevice(device: any): ParsedDaikinData {
    const climateControls: ParsedDaikinData['climateControls'] = [];

    // Trova tutti i management points di tipo climateControl
    const climateControlPoints = device.managementPoints?.filter(
      (mp: any) => mp.managementPointType === 'climateControl'
    ) || [];

    for (const controlPoint of climateControlPoints) {
      const sensoryData = controlPoint.sensoryData?.value;
      const tempControl = controlPoint.temperatureControl?.value;
      const fanControl = controlPoint.fanControl?.value;
      const consumptionData = controlPoint.consumptionData?.value;

      // Calcola i consumi giornalieri, settimanali e mensili
      const consumptionToday = consumptionData?.electrical?.cooling?.d?.reduce((a: number, b: number) => a + b, 0) || 0;
      const consumptionThisWeek = consumptionData?.electrical?.cooling?.w?.reduce((a: number, b: number) => a + b, 0) || 0;
      const consumptionThisMonth = consumptionData?.electrical?.cooling?.m?.reduce((a: number, b: number) => a + b, 0) || 0;

      // Determina la temperatura target basata sulla modalità operativa
      let targetTemperature: number | undefined;
      const operationMode = controlPoint.operationMode?.value;
      if (tempControl?.operationModes && operationMode) {
        targetTemperature = tempControl.operationModes[operationMode]?.setpoints?.roomTemperature?.value;
      }

      // Estrai dati fan per la modalità corrente
      const currentFanData = fanControl?.operationModes?.[operationMode || 'cooling'];

      climateControls.push({
        id: controlPoint.embeddedId,
        name: controlPoint.name?.value || 'Unnamed Device',
        isOn: controlPoint.onOffMode?.value === 'on',
        mode: operationMode || 'unknown',
        roomTemperature: sensoryData?.roomTemperature?.value,
        roomHumidity: sensoryData?.roomHumidity?.value,
        outdoorTemperature: sensoryData?.outdoorTemperature?.value,
        targetTemperature,
        fanSpeed: currentFanData?.fanSpeed?.currentMode?.value,
        fanDirectionHorizontal: currentFanData?.fanDirection?.horizontal?.currentMode?.value,
        fanDirectionVertical: currentFanData?.fanDirection?.vertical?.currentMode?.value,
        powerfulMode: controlPoint.powerfulMode?.value === 'on',
        isInErrorState: controlPoint.isInErrorState?.value || false,
        isInWarningState: controlPoint.isInWarningState?.value || false,
        isInCautionState: controlPoint.isInCautionState?.value || false,
        consumptionToday,
        consumptionThisWeek,
        consumptionThisMonth
      });
    }

    return {
      deviceId: device._id,
      deviceModel: device.deviceModel,
      isOnline: device.isCloudConnectionUp?.value || false,
      climateControls
    };
  }
}

export type { DaikinDevice, ManagementPoint, ParsedDaikinData };
