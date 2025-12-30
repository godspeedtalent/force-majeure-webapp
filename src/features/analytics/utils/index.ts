export {
  getSessionId,
  isSessionSampled,
  getUtmParams,
  clearSession,
} from './sessionManager';

export {
  type DeviceInfo,
  detectDeviceType,
  detectBrowser,
  detectOS,
  getDeviceInfo,
} from './deviceDetection';

export {
  getPageType,
  getResourceId,
  getPageSource,
  getReferrer,
  getCurrentOrigin,
} from './pageUtils';
