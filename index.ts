// Prevent Hermes non-configurable property errors
const _defineProperty = Object.defineProperty;
Object.defineProperty = function(obj, prop, descriptor) {
  try { return _defineProperty(obj, prop, descriptor); } catch(e) { return obj; }
};
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';
global.Buffer = Buffer;
import { registerRootComponent } from 'expo';
import App from './App';
registerRootComponent(App);